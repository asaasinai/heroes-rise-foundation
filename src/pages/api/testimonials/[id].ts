import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError, parseNumericId, sendError } from "@/lib/api-utils";
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
  if (req.method === "PUT") {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const id = parseNumericId(req.query.id);
      if (!id) return sendError(res, 400, "Invalid testimonial ID.");

      const parsed = testimonialSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, "Invalid testimonial payload.");

      const sanitized = sanitizeTestimonialPayload(parsed.data);
      const result = await query<Testimonial>(
        "UPDATE testimonials SET name = $1, role = $2, story = $3, image_url = $4 WHERE id = $5 RETURNING id, name, role, story, image_url, created_at",
        [sanitized.name, sanitized.role, sanitized.story, sanitized.image_url, id]
      );

      if (!result.rows[0]) return sendError(res, 404, "Testimonial not found.");
      return res.status(200).json({ data: result.rows[0] });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else if (req.method === "DELETE") {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const id = parseNumericId(req.query.id);
      if (!id) return sendError(res, 400, "Invalid testimonial ID.");

      const deleted = await query<{ id: number }>("DELETE FROM testimonials WHERE id = $1 RETURNING id", [id]);
      if (!deleted.rows[0]) return sendError(res, 404, "Testimonial not found.");
      return res.status(200).json({ data: { id } });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
