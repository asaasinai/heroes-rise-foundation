import type { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "@/lib/api-utils";
import { query } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      await query(
        `
          INSERT INTO impact_metrics (metric_name, value, description)
          VALUES ('Page Views', 1, 'Total homepage views')
          ON CONFLICT (metric_name)
          DO UPDATE SET value = impact_metrics.value + 1, updated_at = NOW()
        `
      );
      return res.status(200).json({ data: { tracked: true } });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
