import { powerModeToAssistantStyle } from "@/lib/agent-power";
import type { UpdateUserSettingsInput, UserSettings } from "@/types/settings";

const LOCAL_KEY = "paios_user_settings_v1";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  displayName: null,
  preferredLanguage: "id",
  timezone: null,
  assistantStyle: "balanced",
  agentPowerMode: "sedang",
  useAgentTeam: false,
  updatedAt: new Date().toISOString(),
};

function readLocalSettings(): UserSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) } as UserSettings;
  } catch {
    return null;
  }
}

function writeLocalSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
  } catch {
    // quota / private mode
  }
}

function mergeSettings(
  base: UserSettings,
  input: UpdateUserSettingsInput
): UserSettings {
  const agentPowerMode = input.agentPowerMode ?? base.agentPowerMode;
  return {
    displayName:
      input.displayName !== undefined ? input.displayName : base.displayName,
    preferredLanguage: input.preferredLanguage ?? base.preferredLanguage,
    timezone: input.timezone !== undefined ? input.timezone : base.timezone,
    assistantStyle:
      input.agentPowerMode !== undefined
        ? powerModeToAssistantStyle(agentPowerMode)
        : input.assistantStyle ?? base.assistantStyle,
    agentPowerMode,
    useAgentTeam: input.useAgentTeam ?? base.useAgentTeam,
    updatedAt: new Date().toISOString(),
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function fetchSettings(): Promise<UserSettings> {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });

    if (res.status === 503) {
      return readLocalSettings() ?? DEFAULT_USER_SETTINGS;
    }

    if (!res.ok) {
      throw new Error(await parseError(res));
    }

    const data = (await res.json()) as { settings: UserSettings };
    writeLocalSettings(data.settings);
    return data.settings;
  } catch {
    return readLocalSettings() ?? DEFAULT_USER_SETTINGS;
  }
}

export async function saveSettings(
  input: UpdateUserSettingsInput,
  current: UserSettings = DEFAULT_USER_SETTINGS
): Promise<UserSettings> {
  const optimistic = mergeSettings(current, input);

  try {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (res.status === 503) {
      writeLocalSettings(optimistic);
      return optimistic;
    }

    if (!res.ok) {
      throw new Error(await parseError(res));
    }

    const data = (await res.json()) as { settings: UserSettings };
    writeLocalSettings(data.settings);
    return data.settings;
  } catch (error) {
    if (error instanceof TypeError) {
      writeLocalSettings(optimistic);
      return optimistic;
    }
    throw error;
  }
}
