import type { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import type { ImpactMetric } from "@/lib/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const result = await query<ImpactMetric>(
        "SELECT id, metric_name, value, description, updated_at FROM impact_metrics ORDER BY id ASC"
      );
      return res.status(200).json({ data: result.rows });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
