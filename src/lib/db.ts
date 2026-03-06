import { neon } from "@neondatabase/serverless";
import type { QueryResult, QueryResultRow } from "pg";

const getSql = () => {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("POSTGRES_URL is not configured.");
  return neon(connectionString);
};

export const query = async <T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const sql = getSql();
  const rows = (await sql(text, params ?? [])) as T[];
  return { rows, rowCount: rows.length } as unknown as QueryResult<T>;
};
