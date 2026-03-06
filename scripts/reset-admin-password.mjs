import bcrypt from "bcryptjs";
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
  const passwordHash = await bcrypt.hash(password, 10);

  await client.connect();

  const result = await client.query(
    "UPDATE admin_users SET password_hash = $1 WHERE email = $2",
    [passwordHash, email],
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
