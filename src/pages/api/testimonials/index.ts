import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError, sendError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import type { Testimonial } from "@/lib/types";
import { testimonialSchema } from "@/lib/validation";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const result = await query<Testimonial>(
        "SELECT id, name, role, story, image_url, created_at FROM testimonials ORDER BY created_at DESC"
      );
      return res.status(200).json({ data: result.rows });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else if (req.method === "POST") {
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

      return res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
