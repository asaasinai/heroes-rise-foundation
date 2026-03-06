import { neon } from "@neondatabase/serverless";
import type { QueryResult, QueryResultRow } from "pg";

const getSql = () => {
  const connectionString = process.env.HR_POSTGRES_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("HR_POSTGRES_URL is not configured.");
  return neon(connectionString);
};

export const query = async <T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const sql = getSql();
  const args = params ?? [];

  // Split query into parts around $1, $2, etc. placeholders
  // and reconstruct as tagged template literal call
  const parts = text.split(/\$\d+/);
  const strings = Object.assign(parts, { raw: parts }) as TemplateStringsArray;
  const rows = (await sql(strings, ...args)) as unknown as T[];
  return { rows, rowCount: rows.length } as unknown as QueryResult<T>;
};
