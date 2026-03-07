import type { NextApiRequest, NextApiResponse } from "next";
import { hashPassword } from "@/lib/auth";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import { handleApiError, sendError } from "@/lib/api-utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { secret, email, password } = req.body ?? {};
      const resetSecret = process.env.RESET_SECRET;

      if (!resetSecret || secret !== resetSecret) return sendError(res, 403, "Forbidden.");
      if (typeof email !== "string" || typeof password !== "string" || password.length < 8) {
        return sendError(res, 400, "Invalid payload.");
      }

      const hash = hashPassword(password);
      const normalizedEmail = sanitizeText(email.toLowerCase());
      const result = await query("UPDATE admin_users SET password_hash = $1 WHERE email = $2 RETURNING id", [
        hash,
        normalizedEmail
      ]);

      if (!result.rows[0]) return sendError(res, 404, "User not found.");
      return res.status(200).json({ data: { updated: true } });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
