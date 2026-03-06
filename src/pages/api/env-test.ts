import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    urlStart: process.env.POSTGRES_URL?.substring(0, 40) ?? "NOT SET",
    hasHrUrl: !!process.env.HR_POSTGRES_URL,
    hrUrlStart: process.env.HR_POSTGRES_URL?.substring(0, 40) ?? "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  });
}
