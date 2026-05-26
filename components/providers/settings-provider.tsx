"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchSettings, saveSettings } from "@/lib/settings-client";
import type { UpdateUserSettingsInput, UserSettings } from "@/types/settings";

type SettingsContextValue = {
  settings: UserSettings;
  isLoading: boolean;
  updateSettings: (input: UpdateUserSettingsInput) => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const DEFAULT_SETTINGS: UserSettings = {
  displayName: null,
  preferredLanguage: "id",
  timezone: null,
  assistantStyle: "balanced",
  agentPowerMode: "sedang",
  useAgentTeam: false,
  updatedAt: new Date().toISOString(),
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch {
      // keep defaults when DB offline
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await refreshSettings();
      setIsLoading(false);
    })();
  }, [refreshSettings]);

  const updateSettings = useCallback(
    async (input: UpdateUserSettingsInput) => {
      const updated = await saveSettings(input, settings);
      setSettings(updated);
    },
    [settings]
  );

  const value = useMemo(
    () => ({ settings, isLoading, updateSettings, refreshSettings }),
    [settings, isLoading, updateSettings, refreshSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
