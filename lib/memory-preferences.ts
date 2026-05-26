export type MemoryRecallDisplay = "hybrid" | "keyword" | "semantic";

export interface MemoryPreferences {
  autoLearnFromChat: boolean;
  showSessionMemories: boolean;
  defaultFilter: "all" | "preference" | "long_term" | "project" | "session";
  recallDisplay: MemoryRecallDisplay;
}

const STORAGE_KEY = "paios.memory.preferences.v4";

export const DEFAULT_MEMORY_PREFERENCES: MemoryPreferences = {
  autoLearnFromChat: true,
  showSessionMemories: true,
  defaultFilter: "all",
  recallDisplay: "hybrid",
};

export function loadMemoryPreferences(): MemoryPreferences {
  if (typeof window === "undefined") return DEFAULT_MEMORY_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MEMORY_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<MemoryPreferences>;
    return { ...DEFAULT_MEMORY_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_MEMORY_PREFERENCES;
  }
}

export function saveMemoryPreferences(prefs: MemoryPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
