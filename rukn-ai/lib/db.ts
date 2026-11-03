import { Pool } from "pg";

const globalForPg = globalThis as typeof globalThis & { ruknPool?: Pool };

export const pool = globalForPg.ruknPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 7000,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

if (process.env.NODE_ENV !== "production") globalForPg.ruknPool = pool;

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const result = await pool.query<T>(sql, params);
  return result;
}
