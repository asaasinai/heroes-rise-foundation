import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError, sendError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import { subscriberSchema } from "@/lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const subscribers = await query<{ id: number; email: string; signup_date: string }>(
        "SELECT id, email, signup_date FROM subscribers ORDER BY signup_date DESC"
      );
      return res.status(200).json({ data: subscribers.rows });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else if (req.method === "POST") {
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
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
