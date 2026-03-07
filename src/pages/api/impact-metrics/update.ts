import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError, sendError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import type { ImpactMetric } from "@/lib/types";
import { metricBatchSchema } from "@/lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PUT") {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const parsed = metricBatchSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, "Invalid metric payload.");

      const updates = await Promise.all(
        parsed.data.metrics.map(async (metric) =>
          query<ImpactMetric>(
            `
              INSERT INTO impact_metrics (metric_name, value, description)
              VALUES ($1, $2, $3)
              ON CONFLICT (metric_name)
              DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW()
              RETURNING id, metric_name, value, description, updated_at
            `,
            [sanitizeText(metric.metric_name), metric.value, sanitizeText(metric.description)]
          )
        )
      );

      return res.status(200).json({ data: updates.map((result) => result.rows[0]) });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
