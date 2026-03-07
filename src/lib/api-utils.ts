import type { NextApiResponse } from "next";

export const sendError = (res: NextApiResponse, status: number, message: string) =>
  res.status(status).json({ error: message });

export const parseNumericId = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;
  const id = Number(rawValue);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const handleApiError = (res: NextApiResponse, error: unknown) => {
  console.error("[heroes-rise-api:error]", error);
  return sendError(res, 500, "Internal server error.");
};
