import { sql } from "@/lib/db";
import type {
  ConversationRecord,
  ConversationWithMessages,
  StoredMessage,
} from "@/types/conversation";

type ConversationRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  model_used: string | null;
  model_label: string | null;
  intent: string | null;
  routing_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount: row.message_count
      ? Number(row.message_count)
      : undefined,
  };
}

function mapMessage(row: MessageRow): StoredMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as StoredMessage["role"],
    content: row.content,
    modelUsed: row.model_used,
    modelLabel: row.model_label,
    intent: row.intent,
    routingReason: row.routing_reason,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function createConversation(title = "New chat"): Promise<ConversationRecord> {
  const rows = await sql`
    INSERT INTO conversations (title)
    VALUES (${title})
    RETURNING id, title, created_at, updated_at
  `;
  return mapConversation(rows[0] as ConversationRow);
}

export async function listConversations(limit = 50): Promise<ConversationRecord[]> {
  const rows = await sql`
    SELECT
      c.id,
      c.title,
      c.created_at,
      c.updated_at,
      COUNT(m.id)::text AS message_count
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
    LIMIT ${limit}
  `;
  return (rows as ConversationRow[]).map(mapConversation);
}

export async function getConversation(
  id: string
): Promise<ConversationWithMessages | null> {
  const convRows = await sql`
    SELECT id, title, created_at, updated_at
    FROM conversations
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!convRows.length) return null;

  const messageRows = await sql`
    SELECT
      id, conversation_id, role, content,
      model_used, model_label, intent, routing_reason,
      metadata, created_at
    FROM messages
    WHERE conversation_id = ${id}
    ORDER BY created_at ASC
  `;

  const conv = mapConversation(convRows[0] as ConversationRow);
  return {
    ...conv,
    messages: (messageRows as MessageRow[]).map(mapMessage),
  };
}

export async function touchConversation(id: string): Promise<void> {
  await sql`
    UPDATE conversations SET updated_at = NOW() WHERE id = ${id}
  `;
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  await sql`
    UPDATE conversations
    SET title = ${title}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function deleteConversation(id: string): Promise<void> {
  // Remove session memories first — ON DELETE SET NULL would promote them to
  // global rows and can violate memories_global_key_unique on (type, key).
  await sql`DELETE FROM memories WHERE conversation_id = ${id}`;
  await sql`DELETE FROM conversations WHERE id = ${id}`;
}

export async function insertMessage(input: {
  conversationId: string;
  role: StoredMessage["role"];
  content: string;
  modelUsed?: string | null;
  modelLabel?: string | null;
  intent?: string | null;
  routingReason?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<StoredMessage> {
  const rows = await sql`
    INSERT INTO messages (
      conversation_id, role, content,
      model_used, model_label, intent, routing_reason, metadata
    )
    VALUES (
      ${input.conversationId},
      ${input.role},
      ${input.content},
      ${input.modelUsed ?? null},
      ${input.modelLabel ?? null},
      ${input.intent ?? null},
      ${input.routingReason ?? null},
      ${JSON.stringify(input.metadata ?? {})}
    )
    RETURNING
      id, conversation_id, role, content,
      model_used, model_label, intent, routing_reason,
      metadata, created_at
  `;

  await touchConversation(input.conversationId);
  return mapMessage(rows[0] as MessageRow);
}

export function titleFromFirstMessage(content: string): string {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  return cleaned.length > 48 ? `${cleaned.slice(0, 48)}…` : cleaned;
}
