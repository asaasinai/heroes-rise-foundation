import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import { signAdminToken, verifyAdminToken, verifyPassword } from "@/lib/auth";
import {
  cmsSchema,
  contactSchema,
  donationCheckoutSchema,
  loginSchema,
  metricBatchSchema,
  storySchema,
  subscriberSchema,
  testimonialSchema
} from "@/lib/validation";
import type { ImpactMetric, Story, Testimonial } from "@/lib/types";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS policy"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const sendError = (res: Response, status: number, message: string) =>
  res.status(status).json({ error: message });

const parseNumericId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const sanitizeStoryPayload = (payload: { title: string; content: string; image_url: string }) => ({
  title: sanitizeText(payload.title),
  content: sanitizeText(payload.content),
  image_url: sanitizeText(payload.image_url)
});

const sanitizeTestimonialPayload = (payload: {
  name: string;
  role: string;
  story: string;
  image_url: string;
}) => ({
  name: sanitizeText(payload.name),
  role: sanitizeText(payload.role),
  story: sanitizeText(payload.story),
  image_url: sanitizeText(payload.image_url)
});

const getAdminFromRequest = async (req: Request) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) return null;

  const token = authorization.replace("Bearer ", "").trim();
  if (!token) return null;

  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
};

const requireAdmin = async (req: Request, res: Response) => {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    sendError(res, 401, "Unauthorized");
    return null;
  }
  return admin;
};

const sendContactNotification = async (payload: { name: string; email: string; message: string }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFICATION_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? "Heroes Rise <no-reply@heroesrise.org>";

  if (!apiKey || !to) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "New Heroes Rise contact submission",
      html: `
        <h2>New Contact Submission</h2>
        <p><strong>Name:</strong> ${payload.name}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Message:</strong></p>
        <p>${payload.message}</p>
      `
    })
  });
};

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "heroes-rise-api",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/content/:slug", async (req, res, next) => {
  try {
    const slug = sanitizeText(req.params.slug);
    const result = await query<{ id: number; slug: string; content: Record<string, unknown>; updated_at: string }>(
      "SELECT id, slug, content, updated_at FROM site_content WHERE slug = $1 LIMIT 1",
      [slug]
    );
    res.status(200).json({ data: result.rows[0] ?? null });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid login payload.");

    const email = sanitizeText(parsed.data.email.toLowerCase());

    const adminUser = await query<{ id: number; email: string; password_hash: string }>(
      "SELECT id, email, password_hash FROM admin_users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (!adminUser.rows[0]) return sendError(res, 401, "Invalid email or password.");

    const validPassword = await verifyPassword(parsed.data.password, adminUser.rows[0].password_hash);
    if (!validPassword) return sendError(res, 401, "Invalid email or password.");

    const token = await signAdminToken({
      sub: String(adminUser.rows[0].id),
      email: adminUser.rows[0].email,
      role: "admin"
    });

    return res.status(200).json({ data: { token } });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/stories", async (_req, res, next) => {
  try {
    const stories = await query<Story>(
      "SELECT id, title, content, image_url, published_at FROM stories ORDER BY published_at DESC"
    );
    res.status(200).json({ data: stories.rows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/stories", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const parsed = storySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid story payload.");

    const sanitized = sanitizeStoryPayload(parsed.data);
    const story = await query<Story>(
      "INSERT INTO stories (title, content, image_url) VALUES ($1, $2, $3) RETURNING id, title, content, image_url, published_at",
      [sanitized.title, sanitized.content, sanitized.image_url]
    );

    res.status(201).json({ data: story.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.get("/api/stories/:id", async (req, res, next) => {
  try {
    const id = parseNumericId(req.params.id);
    if (!id) return sendError(res, 400, "Invalid story ID.");

    const story = await query<Story>(
      "SELECT id, title, content, image_url, published_at FROM stories WHERE id = $1",
      [id]
    );

    if (!story.rows[0]) return sendError(res, 404, "Story not found.");
    return res.status(200).json({ data: story.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.put("/api/stories/:id", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const id = parseNumericId(req.params.id);
    if (!id) return sendError(res, 400, "Invalid story ID.");

    const parsed = storySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid story payload.");

    const sanitized = sanitizeStoryPayload(parsed.data);
    const story = await query<Story>(
      "UPDATE stories SET title = $1, content = $2, image_url = $3 WHERE id = $4 RETURNING id, title, content, image_url, published_at",
      [sanitized.title, sanitized.content, sanitized.image_url, id]
    );

    if (!story.rows[0]) return sendError(res, 404, "Story not found.");
    return res.status(200).json({ data: story.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/stories/:id", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const id = parseNumericId(req.params.id);
    if (!id) return sendError(res, 400, "Invalid story ID.");

    const deleted = await query<{ id: number }>("DELETE FROM stories WHERE id = $1 RETURNING id", [id]);
    if (!deleted.rows[0]) return sendError(res, 404, "Story not found.");
    return res.status(200).json({ data: { id } });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/testimonials", async (_req, res, next) => {
  try {
    const result = await query<Testimonial>(
      "SELECT id, name, role, story, image_url, created_at FROM testimonials ORDER BY created_at DESC"
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/testimonials", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid testimonial payload.");

    const sanitized = sanitizeTestimonialPayload(parsed.data);
    const result = await query<Testimonial>(
      "INSERT INTO testimonials (name, role, story, image_url) VALUES ($1, $2, $3, $4) RETURNING id, name, role, story, image_url, created_at",
      [sanitized.name, sanitized.role, sanitized.story, sanitized.image_url]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.put("/api/testimonials/:id", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const id = parseNumericId(req.params.id);
    if (!id) return sendError(res, 400, "Invalid testimonial ID.");

    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid testimonial payload.");

    const sanitized = sanitizeTestimonialPayload(parsed.data);
    const result = await query<Testimonial>(
      "UPDATE testimonials SET name = $1, role = $2, story = $3, image_url = $4 WHERE id = $5 RETURNING id, name, role, story, image_url, created_at",
      [sanitized.name, sanitized.role, sanitized.story, sanitized.image_url, id]
    );

    if (!result.rows[0]) return sendError(res, 404, "Testimonial not found.");
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/testimonials/:id", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const id = parseNumericId(req.params.id);
    if (!id) return sendError(res, 400, "Invalid testimonial ID.");

    const deleted = await query<{ id: number }>("DELETE FROM testimonials WHERE id = $1 RETURNING id", [id]);
    if (!deleted.rows[0]) return sendError(res, 404, "Testimonial not found.");
    return res.status(200).json({ data: { id } });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/impact-metrics", async (_req, res, next) => {
  try {
    const result = await query<ImpactMetric>(
      "SELECT id, metric_name, value, description, updated_at FROM impact_metrics ORDER BY id ASC"
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/impact-metrics/views", async (_req, res, next) => {
  try {
    await query(
      `
        INSERT INTO impact_metrics (metric_name, value, description)
        VALUES ('Page Views', 1, 'Total homepage views')
        ON CONFLICT (metric_name)
        DO UPDATE SET value = impact_metrics.value + 1, updated_at = NOW()
      `
    );
    res.status(200).json({ data: { tracked: true } });
  } catch (error) {
    next(error);
  }
});

app.put("/api/impact-metrics", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const parsed = metricBatchSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid metric payload.");

    const updates = await Promise.all(
      parsed.data.metrics.map(async (metric) =>
        query<ImpactMetric>(
          `
            INSERT INTO impact_metrics (metric_name, value, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (metric_name)
            DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW()
            RETURNING id, metric_name, value, description, updated_at
          `,
          [sanitizeText(metric.metric_name), metric.value, sanitizeText(metric.description)]
        )
      )
    );

    res.status(200).json({ data: updates.map((result: { rows: ImpactMetric[] }) => result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/subscribers", async (req, res, next) => {
  try {
    const parsed = subscriberSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid email address.");

    const email = sanitizeText(parsed.data.email.toLowerCase());
    const result = await query<{ id: number; email: string; signup_date: string }>(
      `
        INSERT INTO subscribers (email)
        VALUES ($1)
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email, signup_date
      `,
      [email]
    );

    if (!result.rows[0]) {
      return res.status(200).json({ data: { email, subscribed: true, message: "Already subscribed." } });
    }

    return res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/subscribers", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const subscribers = await query<{ id: number; email: string; signup_date: string }>(
      "SELECT id, email, signup_date FROM subscribers ORDER BY signup_date DESC"
    );
    res.status(200).json({ data: subscribers.rows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/contact", async (req, res, next) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid contact payload.");

    const payload = {
      name: sanitizeText(parsed.data.name),
      email: sanitizeText(parsed.data.email.toLowerCase()),
      message: sanitizeText(parsed.data.message)
    };

    const result = await query<{ id: number; name: string; email: string; message: string; date: string }>(
      "INSERT INTO contact_submissions (name, email, message) VALUES ($1, $2, $3) RETURNING id, name, email, message, date",
      [payload.name, payload.email, payload.message]
    );

    void sendContactNotification(payload);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.get("/api/contact", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const submissions = await query<{ id: number; name: string; email: string; message: string; date: string }>(
      "SELECT id, name, email, message, date FROM contact_submissions ORDER BY date DESC"
    );
    res.status(200).json({ data: submissions.rows });
  } catch (error) {
    next(error);
  }
});

app.get("/api/donation-links", (_req, res) => {
  const links = [
    {
      title: "Direct Campaign",
      description: "Support immediate relief and rescue operations.",
      url: process.env.DONATION_LINK_PRIMARY ?? "https://donate.stripe.com/test_14A8wQ8gz6Yj9jy9AA"
    },
    {
      title: "Corporate Partnership",
      description: "Sponsor local programming and family support initiatives.",
      url: process.env.DONATION_LINK_PARTNER ?? "https://donate.stripe.com/test_bIY9AU4Wj7cn8fu6oo"
    }
  ];

  res.status(200).json({ data: links });
});

app.post("/api/donations/checkout-session", async (req, res, next) => {
  try {
    const parsed = donationCheckoutSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid donation payload.");

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) return sendError(res, 503, "Stripe is not configured.");

    const stripe = new Stripe(stripeSecret);
    const interval = parsed.data.interval ?? "one_time";
    const amount = parsed.data.amount ?? 5000;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: interval === "monthly" ? "subscription" : "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            recurring: interval === "monthly" ? { interval: "month" } : undefined,
            product_data: {
              name: "Heroes Rise Foundation Donation",
              description:
                interval === "monthly"
                  ? "Monthly support for heroes and vulnerable animals."
                  : "One-time donation for urgent support services."
            }
          }
        }
      ],
      success_url: `${siteUrl}/?donation=success`,
      cancel_url: `${siteUrl}/?donation=cancelled`,
      billing_address_collection: "auto"
    });

    res.status(200).json({ data: { checkoutUrl: checkoutSession.url } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/content", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const slug = sanitizeText(String(req.query.slug ?? "homepage"));
    const result = await query<{ id: number; slug: string; content: Record<string, unknown>; updated_at: string }>(
      "SELECT id, slug, content, updated_at FROM site_content WHERE slug = $1 LIMIT 1",
      [slug]
    );
    res.status(200).json({ data: result.rows[0] ?? null });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/content", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const parsed = cmsSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid content payload.");

    const result = await query<{ id: number; slug: string; content: Record<string, unknown>; updated_at: string }>(
      `
        INSERT INTO site_content (slug, content)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (slug)
        DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
        RETURNING id, slug, content, updated_at
      `,
      [sanitizeText(parsed.data.slug), JSON.stringify(parsed.data.content)]
    );

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => sendError(res, 404, "Endpoint not found."));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[heroes-rise-api:error]", error);
  sendError(res, 500, "Internal server error.");
});

export default app;
