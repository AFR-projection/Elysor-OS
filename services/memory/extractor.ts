import { chatCompletion } from "@/lib/openrouter";
import { upsertMemory } from "@/services/memory/repository";
import type { MemoryExtractCandidate, MemoryType } from "@/types/memory";

const VALID_TYPES: MemoryType[] = [
  "preference",
  "long_term",
  "project",
  "session",
];

function parseCandidates(raw: string): MemoryExtractCandidate[] {
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Record<string, unknown> => item && typeof item === "object")
      .map((item) => ({
        type: VALID_TYPES.includes(item.type as MemoryType)
          ? (item.type as MemoryType)
          : "long_term",
        key: String(item.key ?? "").slice(0, 80),
        content: String(item.content ?? "").slice(0, 500),
        importance: Number(item.importance) || 5,
        category: item.category ? String(item.category).slice(0, 40) : undefined,
      }))
      .filter((m) => m.key.length > 0 && m.content.length > 0);
  } catch {
    return [];
  }
}

/**
 * Extract durable memories from an exchange using a fast model.
 * Runs after the main response — non-blocking for the user.
 */
export async function extractAndStoreMemories(input: {
  userMessage: string;
  assistantMessage: string;
  conversationId: string;
  sourceMessageId?: string;
}): Promise<MemoryExtractCandidate[]> {
  const response = await chatCompletion(
    [
      {
        role: "system",
        content: `You are PAIOS memory extractor. Analyze the exchange and extract ONLY durable, useful facts worth remembering across sessions.

Types:
- preference: user likes/dislikes, style, language, habits
- long_term: personal facts (name, job, location, goals)
- project: active projects, tech stack, deadlines
- session: context specific to this conversation thread only

Return a JSON array (max 4 items). Each item:
{"type":"preference|long_term|project|session","key":"snake_case_id","content":"clear fact","importance":1-10,"category":"optional"}

Return [] if nothing worth storing. No markdown, only JSON array.`,
      },
      {
        role: "user",
        content: `USER:\n${input.userMessage}\n\nASSISTANT:\n${input.assistantMessage}`,
      },
    ],
    {
      model: "google/gemini-2.0-flash-001",
      temperature: 0.2,
      max_tokens: 600,
    }
  );

  const raw =
    (response as { choices?: Array<{ message?: { content?: string } }> })
      .choices?.[0]?.message?.content ?? "[]";

  const candidates = parseCandidates(raw);

  for (const candidate of candidates) {
    const conversationId =
      candidate.type === "session" ? input.conversationId : null;

    await upsertMemory({
      ...candidate,
      conversationId,
      sourceMessageId: input.sourceMessageId,
    });
  }

  return candidates;
}
