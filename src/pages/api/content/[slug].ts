import type { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const slugParam = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
      const slug = sanitizeText(slugParam ?? "");
      const result = await query<{ id: number; slug: string; content: Record<string, unknown>; updated_at: string }>(
        "SELECT id, slug, content, updated_at FROM site_content WHERE slug = $1 LIMIT 1",
        [slug]
      );

      return res.status(200).json({ data: result.rows[0] ?? null });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
