import { sql } from "@/lib/db";
import {
  embedText,
  isEmbeddingsAvailable,
  memoryEmbeddingText,
} from "@/lib/embeddings";
import {
  formatPgVector,
  isPgVectorEnabled,
  isValidEmbeddingVector,
} from "@/lib/memory/pgvector";
import type {
  MemoryCreateInput,
  MemoryExtractCandidate,
  MemoryRecord,
  MemoryType,
  MemoryUpdateInput,
} from "@/types/memory";

type MemoryRow = {
  id: string;
  type: string;
  category: string | null;
  key: string;
  content: string;
  importance: number;
  pinned: boolean;
  conversation_id: string | null;
  source_message_id: string | null;
  metadata: Record<string, unknown>;
  embedding: unknown;
  created_at: string;
  updated_at: string;
};

function mapMemory(row: MemoryRow): MemoryRecord {
  return {
    id: row.id,
    type: row.type as MemoryType,
    category: row.category,
    key: row.key,
    content: row.content,
    importance: row.importance,
    pinned: row.pinned ?? false,
    conversationId: row.conversation_id,
    sourceMessageId: row.source_message_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchMemoryRows(options: {
  type?: MemoryType;
  limit: number;
}): Promise<MemoryRow[]> {
  const { type, limit } = options;
  try {
    if (type) {
      return (await sql`
        SELECT * FROM memories
        WHERE type = ${type}
        ORDER BY pinned DESC, importance DESC, updated_at DESC
        LIMIT ${limit}
      `) as MemoryRow[];
    }
    return (await sql`
      SELECT * FROM memories
      ORDER BY pinned DESC, importance DESC, updated_at DESC
      LIMIT ${limit}
    `) as MemoryRow[];
  } catch (error) {
    console.warn("[memories] pinned sort unavailable, using legacy:", error);
    if (type) {
      return (await sql`
        SELECT * FROM memories
        WHERE type = ${type}
        ORDER BY importance DESC, updated_at DESC
        LIMIT ${limit}
      `) as MemoryRow[];
    }
    return (await sql`
      SELECT * FROM memories
      ORDER BY importance DESC, updated_at DESC
      LIMIT ${limit}
    `) as MemoryRow[];
  }
}

async function attachEmbedding(
  key: string,
  content: string
): Promise<number[] | null> {
  if (!isEmbeddingsAvailable()) return null;
  return embedText(memoryEmbeddingText(key, content));
}

export async function getMemoryById(id: string): Promise<MemoryRecord | null> {
  const rows = await sql`SELECT * FROM memories WHERE id = ${id} LIMIT 1`;
  const row = rows[0] as MemoryRow | undefined;
  return row ? mapMemory(row) : null;
}

export async function upsertMemory(
  input: MemoryExtractCandidate & {
    conversationId?: string | null;
    sourceMessageId?: string | null;
  }
): Promise<MemoryRecord> {
  const importance = Math.min(10, Math.max(1, input.importance ?? 5));
  const conversationId = input.conversationId ?? null;
  const pinned = input.pinned ?? false;
  const vector = await attachEmbedding(input.key, input.content);
  const usePgVector =
    isValidEmbeddingVector(vector) && (await isPgVectorEnabled());
  const vectorLiteral = usePgVector ? formatPgVector(vector) : null;
  const embeddingJson = vector ? JSON.stringify(vector) : null;

  if (conversationId) {
    const rows = usePgVector
      ? await sql`
          INSERT INTO memories (
            type, category, key, content, importance, pinned,
            conversation_id, source_message_id, embedding, embedding_vec
          )
          VALUES (
            ${input.type},
            ${input.category ?? null},
            ${input.key},
            ${input.content},
            ${importance},
            ${pinned},
            ${conversationId},
            ${input.sourceMessageId ?? null},
            ${embeddingJson}::jsonb,
            ${vectorLiteral}::vector
          )
          ON CONFLICT (conversation_id, type, key)
          WHERE conversation_id IS NOT NULL
          DO UPDATE SET
            content = EXCLUDED.content,
            importance = GREATEST(memories.importance, EXCLUDED.importance),
            category = COALESCE(EXCLUDED.category, memories.category),
            pinned = EXCLUDED.pinned OR memories.pinned,
            embedding = COALESCE(EXCLUDED.embedding, memories.embedding),
            embedding_vec = COALESCE(EXCLUDED.embedding_vec, memories.embedding_vec),
            updated_at = NOW()
          RETURNING *
        `
      : embeddingJson
        ? await sql`
            INSERT INTO memories (
              type, category, key, content, importance, pinned,
              conversation_id, source_message_id, embedding
            )
            VALUES (
              ${input.type},
              ${input.category ?? null},
              ${input.key},
              ${input.content},
              ${importance},
              ${pinned},
              ${conversationId},
              ${input.sourceMessageId ?? null},
              ${embeddingJson}::jsonb
            )
            ON CONFLICT (conversation_id, type, key)
            WHERE conversation_id IS NOT NULL
            DO UPDATE SET
              content = EXCLUDED.content,
              importance = GREATEST(memories.importance, EXCLUDED.importance),
              category = COALESCE(EXCLUDED.category, memories.category),
              pinned = EXCLUDED.pinned OR memories.pinned,
              embedding = COALESCE(EXCLUDED.embedding, memories.embedding),
              updated_at = NOW()
            RETURNING *
          `
        : await sql`
            INSERT INTO memories (
              type, category, key, content, importance, pinned,
              conversation_id, source_message_id
            )
            VALUES (
              ${input.type},
              ${input.category ?? null},
              ${input.key},
              ${input.content},
              ${importance},
              ${pinned},
              ${conversationId},
              ${input.sourceMessageId ?? null}
            )
            ON CONFLICT (conversation_id, type, key)
            WHERE conversation_id IS NOT NULL
            DO UPDATE SET
              content = EXCLUDED.content,
              importance = GREATEST(memories.importance, EXCLUDED.importance),
              category = COALESCE(EXCLUDED.category, memories.category),
              pinned = EXCLUDED.pinned OR memories.pinned,
              updated_at = NOW()
            RETURNING *
          `;

    return mapMemory(rows[0] as MemoryRow);
  }

  const rows = usePgVector
    ? await sql`
        INSERT INTO memories (
          type, category, key, content, importance, pinned,
          conversation_id, source_message_id, embedding, embedding_vec
        )
        VALUES (
          ${input.type},
          ${input.category ?? null},
          ${input.key},
          ${input.content},
          ${importance},
          ${pinned},
          NULL,
          ${input.sourceMessageId ?? null},
          ${embeddingJson}::jsonb,
          ${vectorLiteral}::vector
        )
        ON CONFLICT (type, key)
        WHERE conversation_id IS NULL
        DO UPDATE SET
          content = EXCLUDED.content,
          importance = GREATEST(memories.importance, EXCLUDED.importance),
          category = COALESCE(EXCLUDED.category, memories.category),
          pinned = EXCLUDED.pinned OR memories.pinned,
          embedding = COALESCE(EXCLUDED.embedding, memories.embedding),
          embedding_vec = COALESCE(EXCLUDED.embedding_vec, memories.embedding_vec),
          updated_at = NOW()
        RETURNING *
      `
    : embeddingJson
      ? await sql`
          INSERT INTO memories (
            type, category, key, content, importance, pinned,
            conversation_id, source_message_id, embedding
          )
          VALUES (
            ${input.type},
            ${input.category ?? null},
            ${input.key},
            ${input.content},
            ${importance},
            ${pinned},
            NULL,
            ${input.sourceMessageId ?? null},
            ${embeddingJson}::jsonb
          )
          ON CONFLICT (type, key)
          WHERE conversation_id IS NULL
          DO UPDATE SET
            content = EXCLUDED.content,
            importance = GREATEST(memories.importance, EXCLUDED.importance),
            category = COALESCE(EXCLUDED.category, memories.category),
            pinned = EXCLUDED.pinned OR memories.pinned,
            embedding = COALESCE(EXCLUDED.embedding, memories.embedding),
            updated_at = NOW()
          RETURNING *
        `
      : await sql`
          INSERT INTO memories (
            type, category, key, content, importance, pinned,
            conversation_id, source_message_id
          )
          VALUES (
            ${input.type},
            ${input.category ?? null},
            ${input.key},
            ${input.content},
            ${importance},
            ${pinned},
            NULL,
            ${input.sourceMessageId ?? null}
          )
          ON CONFLICT (type, key)
          WHERE conversation_id IS NULL
          DO UPDATE SET
            content = EXCLUDED.content,
            importance = GREATEST(memories.importance, EXCLUDED.importance),
            category = COALESCE(EXCLUDED.category, memories.category),
            pinned = EXCLUDED.pinned OR memories.pinned,
            updated_at = NOW()
          RETURNING *
        `;

  return mapMemory(rows[0] as MemoryRow);
}

export async function createMemory(input: MemoryCreateInput): Promise<MemoryRecord> {
  return upsertMemory({
    type: input.type,
    key: input.key,
    content: input.content,
    importance: input.importance,
    category: input.category ?? undefined,
    pinned: input.pinned,
    conversationId: input.conversationId,
    sourceMessageId: input.sourceMessageId,
  });
}

export async function updateMemory(
  id: string,
  patch: MemoryUpdateInput
): Promise<MemoryRecord | null> {
  const existing = await getMemoryById(id);
  if (!existing) return null;

  const next = {
    type: patch.type ?? existing.type,
    key: patch.key ?? existing.key,
    content: patch.content ?? existing.content,
    importance: patch.importance ?? existing.importance,
    category: patch.category !== undefined ? patch.category : existing.category,
    pinned: patch.pinned ?? existing.pinned,
  };

  const vector = await attachEmbedding(next.key, next.content);
  const usePgVector =
    isValidEmbeddingVector(vector) && (await isPgVectorEnabled());
  const vectorLiteral = usePgVector ? formatPgVector(vector) : null;
  const embeddingJson = vector ? JSON.stringify(vector) : null;

  const rows = usePgVector
    ? await sql`
        UPDATE memories SET
          type = ${next.type},
          key = ${next.key},
          content = ${next.content},
          importance = ${next.importance},
          category = ${next.category},
          pinned = ${next.pinned},
          embedding = ${embeddingJson}::jsonb,
          embedding_vec = ${vectorLiteral}::vector,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    : embeddingJson
      ? await sql`
          UPDATE memories SET
            type = ${next.type},
            key = ${next.key},
            content = ${next.content},
            importance = ${next.importance},
            category = ${next.category},
            pinned = ${next.pinned},
            embedding = ${embeddingJson}::jsonb,
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `
      : await sql`
          UPDATE memories SET
            type = ${next.type},
            key = ${next.key},
            content = ${next.content},
            importance = ${next.importance},
            category = ${next.category},
            pinned = ${next.pinned},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;

  return mapMemory(rows[0] as MemoryRow);
}

export async function deleteMemory(id: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM memories WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

export async function listMemories(options?: {
  type?: MemoryType;
  limit?: number;
  query?: string;
  conversationId?: string;
}): Promise<MemoryRecord[]> {
  const limit = options?.limit ?? 100;

  if (options?.query?.trim()) {
    const { recallMemories } = await import("@/services/memory/recall");
    const recalled = await recallMemories(options.query.trim(), {
      conversationId: options.conversationId,
      limit,
    });
    const idOrder = recalled.map((r) => r.id);
    const orderMap = new Map(idOrder.map((id, i) => [id, i]));
    const rows = await fetchMemoryRows({ limit: 200 });
    const idSet = new Set(idOrder);
    return (rows as MemoryRow[])
      .filter((row) => idSet.has(row.id))
      .sort(
        (a, b) =>
          (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
      )
      .slice(0, limit)
      .map(mapMemory);
  }

  if (options?.type) {
    const rows = await fetchMemoryRows({ type: options.type, limit });
    return rows.map(mapMemory);
  }

  const rows = await fetchMemoryRows({ limit });
  return rows.map(mapMemory);
}

export async function countMemories(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS count FROM memories`;
  return (rows[0] as { count: number }).count;
}

export async function countMemoriesWithoutEmbedding(): Promise<number> {
  try {
    const pgvectorReady = await isPgVectorEnabled();
    const rows = pgvectorReady
      ? await sql`
          SELECT COUNT(*)::int AS count FROM memories WHERE embedding_vec IS NULL
        `
      : await sql`
          SELECT COUNT(*)::int AS count FROM memories WHERE embedding IS NULL
        `;
    return (rows[0] as { count: number }).count;
  } catch {
    return 0;
  }
}

/** Backfill missing embedding_vec (and legacy JSONB) in batch. */
export async function backfillEmbeddings(limit = 20): Promise<number> {
  try {
    const pgvectorReady = await isPgVectorEnabled();
    const rows = pgvectorReady
      ? await sql`
          SELECT id, key, content
          FROM memories
          WHERE embedding_vec IS NULL
          ORDER BY updated_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT id, key, content
          FROM memories
          WHERE embedding IS NULL
          ORDER BY updated_at DESC
          LIMIT ${limit}
        `;

    let count = 0;
    for (const row of rows as Array<{ id: string; key: string; content: string }>) {
      const vector = await attachEmbedding(row.key, row.content);
      if (!vector) break;

      const embeddingJson = JSON.stringify(vector);
      if (pgvectorReady) {
        await sql`
          UPDATE memories SET
            embedding = ${embeddingJson}::jsonb,
            embedding_vec = ${formatPgVector(vector)}::vector,
            updated_at = updated_at
          WHERE id = ${row.id}
        `;
      } else {
        await sql`
          UPDATE memories SET embedding = ${embeddingJson}::jsonb, updated_at = updated_at
          WHERE id = ${row.id}
        `;
      }
      count++;
    }
    return count;
  } catch (error) {
    console.warn("[memories] backfill skipped:", error);
    return 0;
  }
}
