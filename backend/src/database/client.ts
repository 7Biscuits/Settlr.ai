import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;

/** A Drizzle executor that is either the base db or an open transaction. */
export type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Verifies database connectivity with a lightweight query.
 * Used by the health check.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT 1 as ok");
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
