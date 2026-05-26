import type { ConversationRecord, ConversationWithMessages } from "@/types/conversation";
import type { MemoryRecord } from "@/types/memory";

export async function fetchConversations(): Promise<ConversationRecord[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) throw new Error("Failed to load conversations");
  const data = (await res.json()) as { conversations: ConversationRecord[] };
  return data.conversations;
}

export async function createConversationApi(): Promise<ConversationRecord> {
  const res = await fetch("/api/conversations", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create conversation");
  const data = (await res.json()) as { conversation: ConversationRecord };
  return data.conversation;
}

export async function fetchConversation(
  id: string
): Promise<ConversationWithMessages> {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) throw new Error("Failed to load conversation");
  const data = (await res.json()) as { conversation: ConversationWithMessages };
  return data.conversation;
}

export async function deleteConversationApi(id: string): Promise<void> {
  const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

export async function fetchMemories(): Promise<{
  memories: MemoryRecord[];
  total: number;
}> {
  const res = await fetch("/api/memories");
  if (!res.ok) throw new Error("Failed to load memories");
  return res.json() as Promise<{ memories: MemoryRecord[]; total: number }>;
}
