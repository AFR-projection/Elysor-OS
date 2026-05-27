import type { MemoryCreateInput, MemoryRecord, MemoryUpdateInput } from "@/types/memory";

export async function fetchMemories(options?: {
  type?: string;
  q?: string;
}): Promise<{ memories: MemoryRecord[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.type) params.set("type", options.type);
  if (options?.q) params.set("q", options.q);

  const qs = params.toString();
  const res = await fetch(`/api/memories${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load memories");
  return res.json() as Promise<{ memories: MemoryRecord[]; total: number }>;
}

export async function createMemoryApi(
  input: MemoryCreateInput
): Promise<MemoryRecord> {
  const res = await fetch("/api/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create memory");
  const data = (await res.json()) as { memory: MemoryRecord };
  return data.memory;
}

export async function updateMemoryApi(
  id: string,
  patch: MemoryUpdateInput
): Promise<MemoryRecord> {
  const res = await fetch(`/api/memories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update memory");
  const data = (await res.json()) as { memory: MemoryRecord };
  return data.memory;
}

export async function deleteMemoryApi(id: string): Promise<void> {
  const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete memory");
}

export type MemoryVectorStats = {
  postgres: {
    total: number;
    withEmbedding: number;
    withoutEmbedding: number;
  };
  pgvector: {
    enabled: boolean;
  };
  recall: "pgvector" | "keyword";
};

export async function fetchMemoryVectorStats(): Promise<MemoryVectorStats> {
  const res = await fetch("/api/memories/vector/stats");
  if (!res.ok) throw new Error("Failed to load vector stats");
  return res.json() as Promise<MemoryVectorStats>;
}

export async function backfillEmbeddingsApi(options?: {
  batchSize?: number;
}): Promise<{ result: { updated: number; done: boolean } }> {
  const res = await fetch("/api/memories/vector/reindex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options ?? {}),
  });
  if (!res.ok) throw new Error("Failed to backfill embeddings");
  return res.json() as Promise<{ result: { updated: number; done: boolean } }>;
}

export async function fetchServerMemoryPrefs(): Promise<{
  prefs: { autoLearnFromChat: boolean; hybridAlpha?: number };
}> {
  const res = await fetch("/api/memories/prefs");
  if (!res.ok) throw new Error("Failed to load memory prefs");
  return res.json() as Promise<{ prefs: { autoLearnFromChat: boolean } }>;
}

export async function updateServerMemoryPrefs(
  patch: Partial<{ autoLearnFromChat: boolean; hybridAlpha: number }>
): Promise<{ prefs: { autoLearnFromChat: boolean; hybridAlpha?: number } }> {
  const res = await fetch("/api/memories/prefs", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to save memory prefs");
  return res.json() as Promise<{ prefs: { autoLearnFromChat: boolean } }>;
}
