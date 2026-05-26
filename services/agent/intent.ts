import type { AgentIntent } from "@/types/agent";

const CODING_PATTERNS = [
  /\b(code|coding|debug|typescript|javascript|python|react|next\.?js|api|function|class|import|npm|git|sql|error|stack trace|refactor)\b/i,
  /```/,
  /\.(ts|tsx|js|jsx|py|go|rs)\b/,
];

const REASONING_PATTERNS = [
  /\b(why|explain|analyze|compare|evaluate|pros and cons|think through|step by step|reasoning|philosophy|strategy|trade-?off)\b/i,
  /\b(jelaskan|mengapa|analisa|bandingkan|pertimbangkan)\b/i,
];

const RESEARCH_PATTERNS = [
  /\b(latest|current|news|today|who is|what is|when did|search|find|research|sources|2024|2025|2026)\b/i,
  /\b(terbaru|berita|cari|siapa|apa itu|kapan)\b/i,
];

export function detectIntent(userMessage: string): AgentIntent {
  const text = userMessage.trim();
  if (!text) return "general";

  const scores: Record<AgentIntent, number> = {
    general: 0,
    reasoning: 0,
    coding: 0,
    research: 0,
    multimodal: 0,
  };

  for (const pattern of CODING_PATTERNS) {
    if (pattern.test(text)) scores.coding += 2;
  }
  for (const pattern of REASONING_PATTERNS) {
    if (pattern.test(text)) scores.reasoning += 2;
  }
  for (const pattern of RESEARCH_PATTERNS) {
    if (pattern.test(text)) scores.research += 2;
  }

  if (text.length > 280) scores.reasoning += 1;
  if (text.includes("?") && scores.research === 0) scores.research += 0.5;

  const ranked = (Object.entries(scores) as [AgentIntent, number][])
    .filter(([key]) => key !== "general")
    .sort((a, b) => b[1] - a[1]);

  const [topIntent, topScore] = ranked[0] ?? ["general", 0];
  if (topScore >= 2) return topIntent;

  return "general";
}
