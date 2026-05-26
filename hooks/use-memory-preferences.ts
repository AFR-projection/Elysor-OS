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

    void fetchServerMemoryPrefs()
      .then(({ prefs: serverPrefs }) => {
        setPrefs((current) => {
          const next = { ...current, autoLearnFromChat: serverPrefs.autoLearnFromChat };
          saveMemoryPreferences(next);
          return next;
        });
      })
      .catch(() => {
        /* local prefs only when DB unavailable */
      });
  }, []);

  const updatePrefs = useCallback((patch: Partial<MemoryPreferences>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      saveMemoryPreferences(next);

      if ("autoLearnFromChat" in patch) {
        void updateServerMemoryPrefs({
          autoLearnFromChat: next.autoLearnFromChat,
        }).catch(() => {
          /* keep local toggle even if server sync fails */
        });
      }

      return next;
    });
  }, []);

  return { prefs, updatePrefs };
}
