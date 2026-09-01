import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

const { Pool } = pg;


const isRemoteDb =
  env.DATABASE_URL.includes("supabase.com") ||
  env.DATABASE_URL.includes("sslmode=require") ||
  env.DATABASE_URL.includes("amazonaws.com");

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});





export const db = drizzle(pool, { schema });


export type Database = typeof db;

/** A Drizzle executor that is either the base db or an open transaction. */
export type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | Database;


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
