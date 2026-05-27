"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchServerMemoryPrefs,
  updateServerMemoryPrefs,
} from "@/lib/memories-client";
import {
  DEFAULT_MEMORY_PREFERENCES,
  loadMemoryPreferences,
  saveMemoryPreferences,
  type MemoryPreferences,
} from "@/lib/memory-preferences";

export function useMemoryPreferences() {
  const [prefs, setPrefs] = useState<MemoryPreferences>(
    DEFAULT_MEMORY_PREFERENCES
  );

  useEffect(() => {
    setPrefs(loadMemoryPreferences());

    (async () => {
      try {
        const { prefs: serverPrefs } = await fetchServerMemoryPrefs();
        setPrefs((current) => {
          const next = { ...current, autoLearnFromChat: serverPrefs.autoLearnFromChat };
          saveMemoryPreferences(next);
          return next;
        });
      } catch {
        /* local prefs only when DB unavailable */
      }
    })();
  }, []);

  const updatePrefs = useCallback(async (patch: Partial<MemoryPreferences>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      saveMemoryPreferences(next);
      return next;
    });

    if ("autoLearnFromChat" in patch) {
      try {
        await updateServerMemoryPrefs({
          autoLearnFromChat: patch.autoLearnFromChat ?? prefs.autoLearnFromChat,
        });
      } catch {
        /* keep local toggle even if server sync fails */
      }
    }
  }, [prefs]);

  return { prefs, updatePrefs };
}