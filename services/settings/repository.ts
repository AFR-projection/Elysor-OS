import { sql } from "@/lib/db";
import { normalizePowerMode, powerModeToAssistantStyle } from "@/lib/agent-power";
import { sanitizeStoredTimezone, isValidTimezone } from "@/lib/timezone";
import { ensureSettingsSchema } from "@/services/settings/schema";
import type {
  AssistantStyle,
  PreferredLanguage,
  UpdateUserSettingsInput,
  UserSettings,
} from "@/types/settings";

type SettingsRow = {
  display_name: string | null;
  preferred_language: string;
  timezone: string | null;
  assistant_style: string;
  agent_power_mode: string | null;
  use_agent_team: boolean | null;
  updated_at: string;
};

const DEFAULTS: UserSettings = {
  displayName: null,
  preferredLanguage: "id",
  timezone: null,
  assistantStyle: "balanced",
  agentPowerMode: "sedang",
  useAgentTeam: false,
  updatedAt: new Date().toISOString(),
};

function mapRow(row: SettingsRow): UserSettings {
  return {
    displayName: row.display_name,
    preferredLanguage: (row.preferred_language as PreferredLanguage) ?? "id",
    timezone: sanitizeStoredTimezone(row.timezone),
    assistantStyle: (row.assistant_style as AssistantStyle) ?? "balanced",
    agentPowerMode: normalizePowerMode(row.agent_power_mode),
    useAgentTeam: row.use_agent_team ?? false,
    updatedAt: row.updated_at,
  };
}

export async function getUserSettings(): Promise<UserSettings> {
  try {
    await ensureSettingsSchema();

    const rows = await sql`
      SELECT display_name, preferred_language, timezone, assistant_style, agent_power_mode, use_agent_team, updated_at
      FROM user_settings WHERE id = 1 LIMIT 1
    `;
    if (!rows.length) return DEFAULTS;

    const row = rows[0] as SettingsRow;
    const sanitized = sanitizeStoredTimezone(row.timezone);

    if (row.timezone && sanitized === null) {
      await sql`
        UPDATE user_settings SET timezone = NULL, updated_at = NOW() WHERE id = 1
      `;
    }

    return mapRow({ ...row, timezone: sanitized });
  } catch (error) {
    console.warn("[settings] get failed:", error);
    return DEFAULTS;
  }
}

export async function updateUserSettings(
  input: UpdateUserSettingsInput
): Promise<UserSettings> {
  await ensureSettingsSchema();

  const current = await getUserSettings();

  let nextTimezone = current.timezone;
  if (input.timezone !== undefined) {
    const trimmed = input.timezone?.trim() ?? "";
    if (!trimmed) {
      nextTimezone = null;
    } else if (isValidTimezone(trimmed)) {
      nextTimezone = trimmed;
    } else {
      throw new Error(
        "Timezone tidak valid. Gunakan format IANA, contoh: Asia/Jakarta"
      );
    }
  }

  const nextPowerMode =
    input.agentPowerMode !== undefined
      ? input.agentPowerMode
      : current.agentPowerMode;
  const nextUseAgentTeam =
    input.useAgentTeam !== undefined
      ? input.useAgentTeam
      : current.useAgentTeam;
  const nextAssistantStyle =
    input.agentPowerMode !== undefined
      ? powerModeToAssistantStyle(nextPowerMode)
      : input.assistantStyle ?? current.assistantStyle;

  const rows = await sql`
    UPDATE user_settings SET
      display_name = ${input.displayName !== undefined ? input.displayName : current.displayName},
      preferred_language = ${input.preferredLanguage ?? current.preferredLanguage},
      timezone = ${nextTimezone},
      assistant_style = ${nextAssistantStyle},
      agent_power_mode = ${nextPowerMode},
      use_agent_team = ${nextUseAgentTeam},
      updated_at = NOW()
    WHERE id = 1
    RETURNING display_name, preferred_language, timezone, assistant_style, agent_power_mode, use_agent_team, updated_at
  `;

  if (!rows.length) {
    throw new Error("Baris pengaturan tidak ditemukan di database");
  }

  return mapRow(rows[0] as SettingsRow);
}

export function formatSettingsForPrompt(settings: UserSettings): string {
  const lines = [
    settings.displayName ? `- Name: ${settings.displayName}` : null,
    `- Language: ${settings.preferredLanguage}`,
    settings.timezone ? `- Timezone override: ${settings.timezone}` : null,
    settings.useAgentTeam
      ? `- Use Agent: ON (5-agent parallel team, MAX power for every task)`
      : `- Use Agent: OFF (single fast agent, mode ${settings.agentPowerMode})`,
    !settings.useAgentTeam
      ? `- Agent power mode: ${settings.agentPowerMode} (hemat=ringkas, sedang=seimbang, max=jarvis)`
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}
