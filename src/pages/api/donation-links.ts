import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const links = [
      {
        title: "Direct Campaign",
        description: "Support immediate relief and rescue operations.",
        url: process.env.DONATION_LINK_PRIMARY ?? "https://donate.stripe.com/test_14A8wQ8gz6Yj9jy9AA"
      },
      {
        title: "Corporate Partnership",
        description: "Sponsor local programming and family support initiatives.",
        url: process.env.DONATION_LINK_PARTNER ?? "https://donate.stripe.com/test_bIY9AU4Wj7cn8fu6oo"
      }
    ];

    res.status(200).json({ data: links });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
