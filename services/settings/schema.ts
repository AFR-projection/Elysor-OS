import { sql } from "@/lib/db";

let schemaEnsured = false;

/** Auto-migrate user_settings columns (safe for existing Neon DBs). */
export async function ensureSettingsSchema(): Promise<void> {
  if (schemaEnsured) return;

  await sql`
    ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS agent_power_mode TEXT NOT NULL DEFAULT 'sedang'
  `;

  await sql`
    ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS use_agent_team BOOLEAN NOT NULL DEFAULT false
  `;

  schemaEnsured = true;
}
