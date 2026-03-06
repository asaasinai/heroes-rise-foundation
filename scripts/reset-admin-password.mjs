import { createHmac, randomBytes } from "crypto";
import pg from "pg";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: node scripts/reset-admin-password.mjs <email> <new-password>");
  process.exit(1);
}

const databaseUrl = process.env.HR_POSTGRES_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error("Missing database URL. Set HR_POSTGRES_URL or POSTGRES_URL.");
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString: databaseUrl });

try {
  const salt = randomBytes(16).toString("hex");
  const secret = process.env.JWT_SECRET ?? "fallback";
  const passwordHash = createHmac("sha256", secret).update(salt + password).digest("hex");
  const storedHash = `${salt}:${passwordHash}`;

  await client.connect();

  const result = await client.query(
    "UPDATE admin_users SET password_hash = $1 WHERE email = $2",
    [storedHash, email],
  );

  if (result.rowCount !== 1) {
    console.error(`No admin user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Updated password hash for ${email}`);
} catch (error) {
  console.error("Failed to reset admin password:", error);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
