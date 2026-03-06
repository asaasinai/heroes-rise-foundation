import type { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sql = neon(process.env.POSTGRES_URL!);
    const result = await sql.query("SELECT email FROM admin_users LIMIT 1");
    res.json({ ok: true, admin: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
