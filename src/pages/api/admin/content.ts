import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError, sendError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import { cmsSchema } from "@/lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const slug = sanitizeText(String(req.query.slug ?? "homepage"));
      const result = await query<{ id: number; slug: string; content: Record<string, unknown>; updated_at: string }>(
        "SELECT id, slug, content, updated_at FROM site_content WHERE slug = $1 LIMIT 1",
        [slug]
      );

      return res.status(200).json({ data: result.rows[0] ?? null });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else if (req.method === "PUT") {
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

      return res.status(200).json({ data: result.rows[0] });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
