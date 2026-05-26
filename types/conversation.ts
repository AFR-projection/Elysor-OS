export interface ConversationRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  modelUsed: string | null;
  modelLabel: string | null;
  intent: string | null;
  routingReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ConversationWithMessages extends ConversationRecord {
  messages: StoredMessage[];
}
