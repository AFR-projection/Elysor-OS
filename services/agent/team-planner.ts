import { chatCompletion } from "@/lib/openrouter";
import { PLANNER_MODEL } from "@/lib/models";
import { buildTeamAgentState, TEAM_AGENT_PROFILES } from "@/lib/team-agents";
import { buildTeamPlannerPrompt } from "@/prompts/team-planner";
import type { AgentPlan } from "@/types/plan";
import type { AgentTeamPlan, TeamAgentRole, TeamAgentState } from "@/types/team";
import type { AgentPowerMode } from "@/types/settings";

const VALID_ROLES: TeamAgentRole[] = [
  "analyst",
  "researcher",
  "builder",
  "creator",
];

const MULTI_TASK_PATTERNS = [
  /\b(bandingkan|compare).*\b(dan|with|vs|versus|chart|statistik|pdf|excel)\b/i,
  /\b(buat|buatkan|bikin).*\b(dan|serta|juga)\b.*\b(cari|search|analisa|code|kode|pdf|excel)\b/i,
  /\b(cari|search|research).*\b(dan|serta)\b.*\b(buat|implement|code|kode|chart|laporan)\b/i,
  /\b(analisa|analyze).*\b(dan|serta)\b.*\b(rekomendasi|chart|pdf|langkah|timeline)\b/i,
  /\b(timeline|statistik|chart).*\b(dan|serta)\b/i,
  /\b(pdf|excel|xlsx|laporan|dokumen)\b.*\b(prediksi|analisa|research|cari|data|chart)\b/i,
  /\b(prediksi|analisa|research)\b.*\b(pdf|excel|xlsx|laporan|kirim|chart)\b/i,
];

/** Score how much a request needs the full parallel team (not casual chat). */
export function scoreTeamMissionNeed(
  userMessage: string,
  plan: AgentPlan
): number {
  const text = userMessage.trim();
  let score = 0;

  if (plan.complexity === "complex") score += 2;
  else if (plan.complexity === "moderate") score += 1;

  if (text.length > 180) score += 1;
  if (text.length > 280) score += 1;

  const multiMatches = MULTI_TASK_PATTERNS.filter((p) => p.test(text)).length;
  score += multiMatches * 2;

  if (plan.tools_needed.length >= 3) score += 1;
  if (plan.tools_needed.length >= 4) score += 1;
  if (plan.steps.length >= 5) score += 1;

  const deliverableCount = (
    text.match(/\b(pdf|excel|xlsx|chart|statistik|timeline|laporan|bandingkan|compare)\b/gi) ??
    []
  ).length;
  if (deliverableCount >= 2) score += 2;

  return score;
}

/**
 * Team mode = mission berat saja (multi-deliverable / research+analisis+output).
 * Chat biasa & task tunggal → single agent pipeline.
 */
export function shouldActivateTeamMode(
  userMessage: string,
  plan: AgentPlan,
  hasAttachments: boolean,
  powerMode: AgentPowerMode = "sedang"
): boolean {
  if (hasAttachments) return false;
  if (plan.complexity === "simple") return false;

  const text = userMessage.trim();
  if (!text) return false;

  const score = scoreTeamMissionNeed(text, plan);
  const hasMultiTask = MULTI_TASK_PATTERNS.some((p) => p.test(text));

  if (powerMode === "hemat") {
    return plan.complexity === "complex" && score >= 5 && hasMultiTask;
  }

  if (powerMode === "sedang") {
    return plan.complexity === "complex" && score >= 4 && hasMultiTask;
  }

  // max — sedikit lebih agresif, tetap butuh sinyal misi berat
  if (plan.complexity === "complex" && score >= 3 && hasMultiTask) {
    return true;
  }

  if (
    plan.complexity === "moderate" &&
    score >= 5 &&
    hasMultiTask &&
    text.length > 160
  ) {
    return true;
  }

  return false;
}

function extractJson(raw: string): string | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  if (trimmed.startsWith("{")) {
    const end = trimmed.lastIndexOf("}");
    if (end > 0) return trimmed.slice(0, end + 1);
  }
  return null;
}

function buildFallbackTeam(userMessage: string, plan: AgentPlan): TeamAgentState[] {
  const agents: TeamAgentState[] = [];
  const text = userMessage.toLowerCase();

  agents.push(
    buildTeamAgentState({
      role: "analyst",
      task: `Analisis dan breakdown permintaan: ${plan.summary}`,
    })
  );

  if (
    plan.tools_needed.includes("web_search") ||
    /terbaru|news|berita|cari|search|2024|2025|2026|harga|siapa|apa itu/i.test(
      text
    )
  ) {
    agents.push(
      buildTeamAgentState({
        role: "researcher",
        task: "Kumpulkan fakta dan data terbaru yang relevan",
      })
    );
  }

  if (
    plan.intent === "coding" ||
    /code|kode|debug|typescript|react|api|function|bug|error/i.test(text)
  ) {
    agents.push(
      buildTeamAgentState({
        role: "builder",
        task: "Siapkan solusi teknis, kode, atau arsitektur",
      })
    );
  }

  if (
    plan.tools_needed.includes("image_generate") ||
    /logo|gambar|design|visual|ilustrasi|poster/i.test(text)
  ) {
    agents.push(
      buildTeamAgentState({
        role: "creator",
        task: "Aspek visual, kreatif, dan desain",
      })
    );
  }

  if (agents.length < 2 && plan.complexity !== "simple") {
    agents.push(
      buildTeamAgentState({
        role: "researcher",
        task: "Konteks tambahan dan referensi untuk melengkapi jawaban",
      })
    );
  }

  return agents.slice(0, 4);
}

export function buildForceFullTeam(plan: AgentPlan): TeamAgentState[] {
  return [
    buildTeamAgentState({
      role: "analyst",
      task: `Analisis strategis & breakdown: ${plan.summary}`,
    }),
    buildTeamAgentState({
      role: "researcher",
      task: "Research fakta, data live, dan referensi pendukung",
    }),
    buildTeamAgentState({
      role: "builder",
      task: "Solusi teknis, langkah implementasi, dan struktur deliverable",
    }),
    buildTeamAgentState({
      role: "creator",
      task: "Framing visual, UX jawaban, dan aspek kreatif",
    }),
  ];
}

export async function buildTeamPlan(input: {
  userMessage: string;
  plan: AgentPlan;
  userLanguage?: string;
  forceFullTeam?: boolean;
}): Promise<AgentTeamPlan> {
  let workerAgents: TeamAgentState[] = [];

  if (input.forceFullTeam) {
    workerAgents = buildForceFullTeam(input.plan);
  } else {
    try {
      const response = await chatCompletion(
        [
          {
            role: "system",
            content: "You output only valid JSON for PAIOS multi-agent teams.",
          },
          {
            role: "user",
            content: buildTeamPlannerPrompt(input),
          },
        ],
        { model: PLANNER_MODEL, temperature: 0.2, max_tokens: 900 }
      );

      const raw = response.choices?.[0]?.message?.content?.trim() ?? "";
      const candidate = extractJson(raw);

      if (candidate) {
        const parsed = JSON.parse(candidate) as {
          summary?: string;
          agents?: Array<{ role?: string; task?: string }>;
        };

        workerAgents = (parsed.agents ?? [])
          .filter(
            (a): a is { role: TeamAgentRole; task: string } =>
              typeof a.role === "string" &&
              VALID_ROLES.includes(a.role as TeamAgentRole) &&
              typeof a.task === "string" &&
              a.task.trim().length > 0
          )
          .slice(0, 4)
          .map((a) =>
            buildTeamAgentState({ role: a.role, task: a.task.trim() })
          );
      }
    } catch (error) {
      console.warn("[team-planner] LLM plan failed, using fallback:", error);
    }

    if (workerAgents.length < 2) {
      workerAgents = buildFallbackTeam(input.userMessage, input.plan);
    }
  }

  const synthesizer = buildTeamAgentState({
    role: "synthesizer",
    task: "Gabungkan semua hasil agent tim menjadi jawaban final yang kohesif",
  });

  return {
    summary: input.forceFullTeam
      ? `Use Agent MAX · 4 specialist + synthesizer`
      : workerAgents.length > 0
        ? `Tim PAIOS · ${workerAgents.length} agent paralel + synthesizer`
        : "Tim PAIOS",
    mode: "parallel",
    agents: [...workerAgents, synthesizer],
    startedAt: new Date().toISOString(),
  };
}

export function getTeamWorkerAgents(team: AgentTeamPlan): TeamAgentState[] {
  return team.agents.filter((a) => a.role !== "synthesizer");
}

export function getTeamSynthesizer(team: AgentTeamPlan): TeamAgentState {
  return (
    team.agents.find((a) => a.role === "synthesizer") ??
    buildTeamAgentState({
      role: "synthesizer",
      task: "Sintesis jawaban final",
    })
  );
}

export function describeTeamRoles(): string {
  return Object.values(TEAM_AGENT_PROFILES)
    .filter((p) => p.role !== "synthesizer")
    .map((p) => `${p.emoji} ${p.name} (${p.description})`)
    .join(" · ");
}
