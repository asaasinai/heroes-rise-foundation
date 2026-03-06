import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | undefined;

const getPool = () => {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error("POSTGRES_URL is not configured.");
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
};

export const query = async <T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => getPool().query<T>(text, params);
