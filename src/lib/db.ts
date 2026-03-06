import { Pool, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __heroesRisePool: Pool | undefined;
}

const createPool = () => {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL is not configured. Add it to your environment variables."
    );
  }

  return new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });
};

const getPool = () => {
  if (!global.__heroesRisePool) {
    global.__heroesRisePool = createPool();
  }

  return global.__heroesRisePool;
};

export const query = async <T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => getPool().query<T>(text, params);
