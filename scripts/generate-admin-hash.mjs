import { createHmac, randomBytes } from "crypto";

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error("Usage: node scripts/generate-admin-hash.mjs <password-at-least-8-chars>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const secret = process.env.JWT_SECRET ?? "fallback";
const hash = createHmac("sha256", secret).update(salt + password).digest("hex");

console.log(`${salt}:${hash}`);
