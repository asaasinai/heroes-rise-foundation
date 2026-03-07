import type { NextApiRequest, NextApiResponse } from "next";
import { signAdminToken, verifyPassword } from "@/lib/auth";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import { handleApiError, sendError } from "@/lib/api-utils";
import { loginSchema } from "@/lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, "Invalid login payload.");

      const email = sanitizeText(parsed.data.email.toLowerCase());
      const adminUser = await query<{ id: number; email: string; password_hash: string }>(
        "SELECT id, email, password_hash FROM admin_users WHERE email = $1 LIMIT 1",
        [email]
      );

      if (!adminUser.rows[0]) return sendError(res, 401, "Invalid email or password.");
      const validPassword = verifyPassword(parsed.data.password, adminUser.rows[0].password_hash);
      if (!validPassword) return sendError(res, 401, "Invalid email or password.");

      const token = await signAdminToken({
        sub: String(adminUser.rows[0].id),
        email: adminUser.rows[0].email,
        role: "admin"
      });

      return res.status(200).json({ data: { token } });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
