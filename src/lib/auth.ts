import bcrypt from "bcryptjs";
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

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);
