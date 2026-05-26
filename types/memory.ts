export type MemoryType = "preference" | "long_term" | "project" | "session";

export type RecallMethod = "hybrid" | "keyword" | "semantic" | "vector";

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  category: string | null;
  key: string;
  content: string;
  importance: number;
  pinned: boolean;
  conversationId: string | null;
  sourceMessageId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RecalledMemory {
  id: string;
  type: MemoryType;
  key: string;
  content: string;
  importance: number;
  score: number;
  category: string | null;
  pinned?: boolean;
  recallMethod?: RecallMethod;
}

export interface MemoryExtractCandidate {
  type: MemoryType;
  key: string;
  content: string;
  importance?: number;
  category?: string;
  pinned?: boolean;
}

export interface MemoryCreateInput {
  type: MemoryType;
  key: string;
  content: string;
  importance?: number;
  category?: string | null;
  pinned?: boolean;
  conversationId?: string | null;
  sourceMessageId?: string | null;
}

export interface MemoryUpdateInput {
  type?: MemoryType;
  key?: string;
  content?: string;
  importance?: number;
  category?: string | null;
  pinned?: boolean;
}

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  preference: "Preferensi",
  long_term: "Jangka panjang",
  project: "Project",
  session: "Sesi chat",
};
