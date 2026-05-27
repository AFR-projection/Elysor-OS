import { sql } from "@/lib/db";

export interface ServerMemoryPreferences {
  autoLearnFromChat: boolean;
  /** Hybrid blending weight for vector similarity (0..1). Keyword weight = 1 - hybridAlpha */
  hybridAlpha: number;
}

export const DEFAULT_SERVER_MEMORY_PREFERENCES: ServerMemoryPreferences = {
  autoLearnFromChat: true,
  hybridAlpha: 0.62,
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function parsePrefs(raw: unknown): ServerMemoryPreferences {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_SERVER_MEMORY_PREFERENCES;
  }

  const obj = raw as Partial<ServerMemoryPreferences>;
  return {
    autoLearnFromChat:
      typeof obj.autoLearnFromChat === "boolean"
        ? obj.autoLearnFromChat
        : DEFAULT_SERVER_MEMORY_PREFERENCES.autoLearnFromChat,
    hybridAlpha:
      typeof obj.hybridAlpha === "number"
        ? clamp01(obj.hybridAlpha)
        : DEFAULT_SERVER_MEMORY_PREFERENCES.hybridAlpha,
  };
}

export async function getServerMemoryPreferences(): Promise<ServerMemoryPreferences> {
  try {
    const rows = await sql`
      SELECT memory_prefs FROM user_settings WHERE id = 1 LIMIT 1
    `;
    const row = rows[0] as { memory_prefs?: unknown } | undefined;
    return parsePrefs(row?.memory_prefs);
  } catch {
    return DEFAULT_SERVER_MEMORY_PREFERENCES;
  }
}

export async function updateServerMemoryPreferences(
  patch: Partial<ServerMemoryPreferences>
): Promise<ServerMemoryPreferences> {
  const current = await getServerMemoryPreferences();
  const next = {
    ...current,
    ...patch,
    hybridAlpha:
      patch.hybridAlpha !== undefined
        ? clamp01(patch.hybridAlpha)
        : current.hybridAlpha,
  };

  await sql`
    UPDATE user_settings
    SET memory_prefs = ${JSON.stringify(next)}::jsonb, updated_at = NOW()
    WHERE id = 1
  `;

  return next;
}
