import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError, sendError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import type { Story } from "@/lib/types";
import { storySchema } from "@/lib/validation";

const sanitizeStoryPayload = (payload: { title: string; content: string; image_url: string }) => ({
  title: sanitizeText(payload.title),
  content: sanitizeText(payload.content),
  image_url: sanitizeText(payload.image_url)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const stories = await query<Story>(
        "SELECT id, title, content, image_url, published_at FROM stories ORDER BY published_at DESC"
      );
      return res.status(200).json({ data: stories.rows });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else if (req.method === "POST") {
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

      return res.status(201).json({ data: story.rows[0] });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
