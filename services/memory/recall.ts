import { sql } from "@/lib/db";
import { embedText, isEmbeddingsAvailable } from "@/lib/embeddings";
import { formatPgVector, isPgVectorEnabled } from "@/lib/memory/pgvector";
import {
  cosineSimilarity,
  parseEmbedding,
} from "@/services/memory/similarity";
import type { MemoryType, RecallMethod, RecalledMemory } from "@/types/memory";

type MemoryCandidate = {
  id: string;
  type: string;
  key: string;
  content: string;
  importance: number;
  category: string | null;
  conversation_id: string | null;
  pinned?: boolean;
  embedding?: unknown;
  similarity?: number;
};

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "must", "shall",
  "can", "to", "of", "in", "for", "on", "with", "at", "by",
  "from", "as", "and", "but", "if", "or", "not", "this", "that",
  "apa", "yang", "dan", "di", "ke", "dari", "untuk", "dengan",
  "ini", "itu", "ada", "akan", "saya", "kamu", "bro", "dong",
  "siapa", "ingat", "kamu",
]);

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .slice(0, 14);
}

function keywordScore(
  memory: MemoryCandidate,
  tokens: string[],
  conversationId?: string
): number {
  const haystack = `${memory.key} ${memory.content}`.toLowerCase();
  let score = memory.importance * 0.35;

  if (memory.pinned) score += 4;
  if (memory.type === "preference") score += 2;
  if (memory.type === "project") score += 1.5;
  if (memory.type === "long_term") score += 1;
  if (conversationId && memory.conversation_id === conversationId) score += 3;

  for (const token of tokens) {
    if (haystack.includes(token)) score += 2.2;
  }

  return score;
}

function normalizeKeywordScore(score: number): number {
  return Math.min(1, score / 18);
}

async function loadCandidates(
  conversationId?: string
): Promise<MemoryCandidate[]> {
  try {
    const rows = await sql`
      SELECT id, type, key, content, importance, category, conversation_id, pinned, embedding
      FROM memories
      WHERE conversation_id IS NULL
        OR conversation_id = ${conversationId ?? null}
      ORDER BY pinned DESC, importance DESC, updated_at DESC
      LIMIT 250
    `;
    return rows as MemoryCandidate[];
  } catch (error) {
    console.warn("[recall] full schema query failed, using legacy:", error);
    const rows = await sql`
      SELECT id, type, key, content, importance, category, conversation_id
      FROM memories
      WHERE conversation_id IS NULL
        OR conversation_id = ${conversationId ?? null}
      ORDER BY importance DESC, updated_at DESC
      LIMIT 250
    `;
    return rows as MemoryCandidate[];
  }
}

function scoreCandidates(
  candidates: MemoryCandidate[],
  query: string,
  options: { conversationId?: string; limit: number }
): RecalledMemory[] {
  const { conversationId, limit } = options;
  const tokens = tokenizeQuery(query);

  const scored = candidates
    .map((m) => {
      const kw = keywordScore(m, tokens, conversationId);
      return {
        id: m.id,
        type: m.type as MemoryType,
        key: m.key,
        content: m.content,
        importance: m.importance,
        category: m.category,
        pinned: m.pinned ?? false,
        score: normalizeKeywordScore(kw) * 100,
        recallMethod: "keyword" as RecallMethod,
        _kw: kw,
      };
    })
    .filter((m) => (tokens.length === 0 ? m.importance >= 4 : m._kw > 2.5))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ _kw: _, ...rest }) => rest);

  return scored;
}

async function recallViaPgVector(
  query: string,
  options: { conversationId?: string; limit: number }
): Promise<RecalledMemory[]> {
  const { conversationId, limit } = options;
  const tokens = tokenizeQuery(query);
  const queryEmbedding = await embedText(query.trim());
  if (!queryEmbedding) return [];

  const queryVec = formatPgVector(queryEmbedding);
  const fetchLimit = Math.max(limit * 3, 24);

  const rows = conversationId
    ? await sql`
        SELECT
          id, type, key, content, importance, category, conversation_id, pinned,
          1 - (embedding_vec <=> ${queryVec}::vector) AS similarity
        FROM memories
        WHERE embedding_vec IS NOT NULL
          AND (conversation_id IS NULL OR conversation_id = ${conversationId})
        ORDER BY embedding_vec <=> ${queryVec}::vector
        LIMIT ${fetchLimit}
      `
    : await sql`
        SELECT
          id, type, key, content, importance, category, conversation_id, pinned,
          1 - (embedding_vec <=> ${queryVec}::vector) AS similarity
        FROM memories
        WHERE embedding_vec IS NOT NULL
          AND conversation_id IS NULL
        ORDER BY embedding_vec <=> ${queryVec}::vector
        LIMIT ${fetchLimit}
      `;

  const scored = (rows as MemoryCandidate[])
    .map((m) => {
      const kw = keywordScore(m, tokens, conversationId);
      const kwNorm = normalizeKeywordScore(kw);
      const vectorScore = Math.max(0, Number(m.similarity) || 0);
      const pinnedBoost = m.pinned ? 0.08 : 0;
      const importanceBoost = Math.min(0.05, m.importance * 0.005);
      const combined =
        vectorScore * 0.62 + kwNorm * 0.28 + pinnedBoost + importanceBoost;

      return {
        id: m.id,
        type: m.type as MemoryType,
        key: m.key,
        content: m.content,
        importance: m.importance,
        category: m.category,
        pinned: m.pinned ?? false,
        score: combined * 100,
        recallMethod: "vector" as RecallMethod,
        _kw: kw,
      };
    })
    .filter((m) => m.score > 10 || m._kw > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ _kw: _, ...rest }) => rest);

  return scored;
}

/** In-memory hybrid fallback when pgvector column unavailable. */
async function recallViaLegacyScan(
  query: string,
  options: { conversationId?: string; limit: number }
): Promise<RecalledMemory[]> {
  const { conversationId, limit } = options;
  const candidates = await loadCandidates(conversationId);
  const tokens = tokenizeQuery(query);

  let queryEmbedding: number[] | null = null;
  if (isEmbeddingsAvailable() && query.trim().length > 0) {
    queryEmbedding = await embedText(query.trim());
  }

  const hasSemantic = queryEmbedding !== null;
  const hasEmbeddings = candidates.some((m) => parseEmbedding(m.embedding));

  if (!hasSemantic || !hasEmbeddings) {
    return scoreCandidates(candidates, query, { conversationId, limit });
  }

  const scored = candidates
    .map((m) => {
      const kw = keywordScore(m, tokens, conversationId);
      const kwNorm = normalizeKeywordScore(kw);
      const memEmbedding = parseEmbedding(m.embedding);
      let recallMethod: RecallMethod = "keyword";
      let score = kwNorm;

      if (queryEmbedding && memEmbedding) {
        const semantic = Math.max(0, cosineSimilarity(queryEmbedding, memEmbedding));
        score = kwNorm * 0.35 + semantic * 0.55 + (m.pinned ? 0.1 : 0);
        recallMethod = tokens.length > 0 ? "hybrid" : "semantic";
      }

      return {
        id: m.id,
        type: m.type as MemoryType,
        key: m.key,
        content: m.content,
        importance: m.importance,
        category: m.category,
        pinned: m.pinned ?? false,
        score: score * 100,
        recallMethod,
        _kw: kw,
      };
    })
    .filter((m) => m.score > 12 || m._kw > 2.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ _kw: _, ...rest }) => rest);

  return scored;
}

export async function recallMemories(
  query: string,
  options: {
    conversationId?: string;
    limit?: number;
  } = {}
): Promise<RecalledMemory[]> {
  const limit = options.limit ?? 10;
  const conversationId = options.conversationId;

  try {
    if (query.trim().length > 0 && isEmbeddingsAvailable()) {
      const pgvectorReady = await isPgVectorEnabled();
      if (pgvectorReady) {
        const vectorResults = await recallViaPgVector(query, {
          conversationId,
          limit,
        });
        if (vectorResults.length > 0) return vectorResults;
      }
    }

    return await recallViaLegacyScan(query, { conversationId, limit });
  } catch (error) {
    console.warn("[recall] pgvector failed, falling back to scan:", error);
    try {
      return await recallViaLegacyScan(query, { conversationId, limit });
    } catch (fallbackError) {
      console.warn("[recall] failed, returning empty:", fallbackError);
      return [];
    }
  }
}
