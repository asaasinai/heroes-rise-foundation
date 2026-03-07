import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError, sendError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import { contactSchema } from "@/lib/validation";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const submissions = await query<{ id: number; name: string; email: string; message: string; date: string }>(
        "SELECT id, name, email, message, date FROM contact_submissions ORDER BY date DESC"
      );
      return res.status(200).json({ data: submissions.rows });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else if (req.method === "POST") {
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
      return res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
