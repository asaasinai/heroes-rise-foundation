import type { NextApiRequest, NextApiResponse } from "next";
import app from "../../../api/index";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Body is already parsed by Next.js — attach it so Express skips re-parsing
  const originalBody = req.body;

  return new Promise<void>((resolve, reject) => {
    // Monkey-patch express.json to use the already-parsed body
    const wrappedReq: any = Object.create(req);
    wrappedReq.body = originalBody;

    app(wrappedReq, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
