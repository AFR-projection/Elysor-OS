import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
}

let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    _sql = neon(getDatabaseUrl());
  }
  return _sql;
}

/** Neon serverless SQL client — use from server code only */
export const sql = getSql();

/** Alias for the database client */
export const db = sql;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
