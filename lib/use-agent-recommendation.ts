import type { AgentPlan } from "@/types/plan";
import {
  scoreTeamMissionNeed,
} from "@/services/agent/team-planner";

const HEAVY_HINTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(bandingkan|compare|vs|versus)\b/i, label: "perbandingan multi-sudut" },
  { pattern: /\b(chart|statistik|grafik|visualisasi)\b/i, label: "visual data / chart" },
  { pattern: /\b(pdf|excel|xlsx|laporan|dokumen|export)\b/i, label: "deliverable file" },
  { pattern: /\b(prediksi|analisa|analyze|research|timeline)\b/i, label: "analisis mendalam" },
  { pattern: /\b(buat|implement|code|kode).*\b(dan|serta)\b/i, label: "multi-step execution" },
];

function buildReason(userMessage: string, plan: AgentPlan, score: number): string {
  const hints = HEAVY_HINTS.filter((h) => h.pattern.test(userMessage)).map(
    (h) => h.label
  );
  const parts = [
    hints.length ? hints.slice(0, 3).join(", ") : null,
    plan.complexity === "complex" ? "kompleksitas tinggi" : null,
    plan.tools_needed.length >= 3 ? `${plan.tools_needed.length} tools dibutuhkan` : null,
  ].filter(Boolean);

  if (parts.length === 0) {
    return `Task ini skor ${score}/10 — tim 5 agent paralel akan jauh lebih thorough.`;
  }

  return `Terdeteksi ${parts.join(" · ")}. Use Agent deploy 4 specialist + synthesizer (MAX).`;
}

export type UseAgentRecommendation = {
  reason: string;
  score: number;
};

/** Recommend Use Agent when OFF but message looks like a heavy mission. */
export function getUseAgentRecommendation(
  userMessage: string,
  plan: AgentPlan
): UseAgentRecommendation | null {
  const text = userMessage.trim();
  if (!text || text.length < 40) return null;

  const score = scoreTeamMissionNeed(text, plan);
  const heavy =
    score >= 3 ||
    (plan.complexity === "complex" && score >= 2) ||
    (plan.complexity === "moderate" && score >= 4);

  if (!heavy) return null;

  return {
    score: Math.min(10, score + (plan.complexity === "complex" ? 2 : 0)),
    reason: buildReason(text, plan, score),
  };
}
