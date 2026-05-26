import type { RecalledMemory } from "@/types/memory";

export function formatMemoriesForPrompt(memories: RecalledMemory[]): string {
  if (memories.length === 0) {
    return "No stored memories matched this turn. Learn useful facts when appropriate.";
  }

  const lines = memories.map((m, i) => {
    const tag = m.category ? `${m.type}/${m.category}` : m.type;
    return `${i + 1}. [${tag}] ${m.key}: ${m.content}`;
  });

  return `The following memories were retrieved for this user (use for personalization — do not invent conflicting facts):\n${lines.join("\n")}`;
}
