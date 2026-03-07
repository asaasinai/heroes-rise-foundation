import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError, parseNumericId, sendError } from "@/lib/api-utils";
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
      const id = parseNumericId(req.query.id);
      if (!id) return sendError(res, 400, "Invalid story ID.");

      const story = await query<Story>(
        "SELECT id, title, content, image_url, published_at FROM stories WHERE id = $1",
        [id]
      );

      if (!story.rows[0]) return sendError(res, 404, "Story not found.");
      return res.status(200).json({ data: story.rows[0] });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else if (req.method === "PUT") {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const id = parseNumericId(req.query.id);
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
      return handleApiError(res, error);
    }
  } else if (req.method === "DELETE") {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const id = parseNumericId(req.query.id);
      if (!id) return sendError(res, 400, "Invalid story ID.");

      const deleted = await query<{ id: number }>("DELETE FROM stories WHERE id = $1 RETURNING id", [id]);
      if (!deleted.rows[0]) return sendError(res, 404, "Story not found.");
      return res.status(200).json({ data: { id } });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
