import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return new TextEncoder().encode(secret);
};

export interface AdminJwtPayload extends JWTPayload {
  sub: string;
  email: string;
  role: "admin";
}

export const signAdminToken = async (payload: AdminJwtPayload) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());

export const verifyAdminToken = async (token: string) => {
  const { payload } = await jwtVerify(token, getJwtSecret());

  if (payload.role !== "admin" || typeof payload.email !== "string") {
    throw new Error("Invalid admin token payload.");
  }

  return payload as unknown as AdminJwtPayload;
};

// Hash format: "salt:hash" where hash = HMAC-SHA256(salt + password, JWT_SECRET)
export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const secret = process.env.JWT_SECRET ?? "fallback";
  const hash = createHmac("sha256", secret).update(salt + password).digest("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const secret = process.env.JWT_SECRET ?? "fallback";
  const hash = createHmac("sha256", secret).update(salt + password).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
  } catch {
    return false;
  }
};
