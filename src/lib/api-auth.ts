import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAdminToken } from "./auth";

export const getAdminFromRequest = async (req: NextApiRequest) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "").trim();
  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
};

export const requireAdmin = async (req: NextApiRequest, res: NextApiResponse) => {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return admin;
};
