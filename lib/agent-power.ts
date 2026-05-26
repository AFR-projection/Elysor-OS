import type { AgentIntent } from "@/types/agent";
import type { ModelRoute } from "@/types/agent";
import type { TurnClassification } from "@/services/agent/turn-classifier";
import { getModelRoute } from "@/lib/models";

export type AgentPowerMode = "hemat" | "sedang" | "max";

export const AGENT_POWER_LABELS: Record<AgentPowerMode, string> = {
  hemat: "Hemat",
  sedang: "Sedang",
  max: "Max",
};

export const AGENT_POWER_DESCRIPTIONS: Record<AgentPowerMode, string> = {
  hemat: "Respons cepat & ringkas. Hemat token — ideal untuk chat ringan.",
  sedang: "Seimbang: langkah jelas, UI blocks, planner aktif untuk kebanyakan task.",
  max: "Jarvis mode — analisis mendalam, langkah lengkap, tim agent lebih agresif, model premium.",
};

export const AGENT_POWER_SPECS: Record<
  AgentPowerMode,
  { tokens: string; model: string; team: string; depth: string; tools: string }
> = {
  hemat: {
    tokens: "~ rendah",
    model: "Gemini Flash",
    team: "Nonaktif",
    depth: "Ringkas",
    tools: "Minimal",
  },
  sedang: {
    tokens: "~ sedang",
    model: "Auto-route",
    team: "Task kompleks",
    depth: "Terstruktur",
    tools: "Standar",
  },
  max: {
    tokens: "~ tinggi",
    model: "Claude Sonnet 4",
    team: "Agresif",
    depth: "Jarvis++",
    tools: "Maksimal",
  },
};

const GREETING_OR_TINY =
  /^(hi|hai|halo|hello|hey|yo|assalamualaikum|waalaikumsalam|selamat\s+(pagi|siang|sore|malam)|thanks|thank you|terima kasih|makasih|ok+|oke+|sip|siap|nice|cool|lol|haha|apa\s+kabar|gimana\s+kabar|how\s+are\s+you)([\s]+[\w]{1,15})?[\s!.?]*$/i;

export function powerModeToAssistantStyle(
  mode: AgentPowerMode
): "concise" | "balanced" | "detailed" {
  if (mode === "hemat") return "concise";
  if (mode === "max") return "detailed";
  return "balanced";
}

export function normalizePowerMode(value: unknown): AgentPowerMode {
  if (value === "hemat" || value === "sedang" || value === "max") return value;
  return "sedang";
}

export function applyPowerModeToClassification(
  base: TurnClassification,
  userMessage: string,
  hasAttachments: boolean,
  powerMode: AgentPowerMode
): TurnClassification {
  const text = userMessage.trim();
  const isPureGreeting = !hasAttachments && GREETING_OR_TINY.test(text);

  if (powerMode === "hemat") {
    if (
      base.tier !== "casual" &&
      !hasAttachments &&
      text.length <= 100 &&
      base.intent === "general" &&
      !/\b(buat|pdf|excel|video|gambar|cari|search|analisa|code|kode)\b/i.test(text)
    ) {
      return {
        tier: "casual",
        intent: "general",
        skipPlanner: true,
        skipToolLoop: true,
        maxToolRounds: 0,
        memoryLimit: 4,
        compactPrompt: true,
      };
    }
    return base;
  }

  if (base.tier === "casual" && !isPureGreeting && text.length > 0) {
    base = {
      tier: "standard",
      intent: base.intent,
      skipPlanner: false,
      skipToolLoop: false,
      maxToolRounds: powerMode === "max" ? 6 : 5,
      memoryLimit: powerMode === "max" ? 12 : 8,
      compactPrompt: false,
    };
  }

  if (powerMode === "max") {
    const shouldBoostComplex =
      base.tier === "standard" &&
      (text.length > 160 ||
        /\b(langkah|step|analisa|analyze|bandingkan|compare|prediksi|rencana|strategi|timeline|laporan)\b/i.test(
          text
        ));

    if (shouldBoostComplex) {
      return {
        ...base,
        tier: "complex",
        skipPlanner: false,
        skipToolLoop: false,
        maxToolRounds: 8,
        memoryLimit: 14,
        compactPrompt: false,
      };
    }

    if (base.tier === "standard") {
      return {
        ...base,
        maxToolRounds: 6,
        memoryLimit: 12,
        compactPrompt: false,
      };
    }

    if (base.tier === "complex") {
      return {
        ...base,
        maxToolRounds: 8,
        memoryLimit: 14,
        compactPrompt: false,
      };
    }
  }

  if (powerMode === "sedang" && base.tier === "standard") {
    return {
      ...base,
      maxToolRounds: 5,
      memoryLimit: 8,
      compactPrompt: false,
    };
  }

  if (isPureGreeting) {
    return {
      ...base,
      tier: "casual",
      skipPlanner: true,
      skipToolLoop: true,
      maxToolRounds: 0,
      memoryLimit: powerMode === "max" ? 6 : 4,
      compactPrompt: true,
    };
  }

  return { ...base, compactPrompt: false };
}

/** Use Agent ON → force full MAX pipeline + team for every message. */
export function applyUseAgentTeamMode(
  base: TurnClassification,
  useAgentTeam: boolean,
  hasAttachments: boolean,
  userMessage: string
): TurnClassification {
  if (!useAgentTeam || hasAttachments || !userMessage.trim()) {
    return base;
  }

  return {
    tier: "complex",
    intent: base.intent === "general" ? "reasoning" : base.intent,
    skipPlanner: false,
    skipToolLoop: false,
    maxToolRounds: 8,
    memoryLimit: 14,
    compactPrompt: false,
  };
}

export function getEffectivePowerMode(
  powerMode: AgentPowerMode,
  useAgentTeam: boolean
): AgentPowerMode {
  return useAgentTeam ? "max" : powerMode;
}

export function getModelRouteForPower(
  intent: AgentIntent,
  powerMode: AgentPowerMode
): ModelRoute {
  const base = getModelRoute(intent);

  if (powerMode === "max") {
    if (intent === "general") {
      return {
        model: "anthropic/claude-sonnet-4",
        label: "Claude Sonnet 4",
        reason: "Max mode — premium reasoning & rich structured answers",
      };
    }
    if (intent === "reasoning") {
      return {
        model: "anthropic/claude-sonnet-4",
        label: "Claude Sonnet 4",
        reason: "Max mode — deep multi-step analysis",
      };
    }
  }

  if (powerMode === "hemat" && intent === "general") {
    return base;
  }

  return base;
}

export function getPowerModeStructuredInstructions(
  powerMode: AgentPowerMode
): string {
  if (powerMode === "max") {
    return `## JARVIS RESPONSE STANDARD (MODE MAX — MANDATORY)
You operate like an elite chief-of-staff AI — proactive, precise, empowering.

For ANY non-greeting question:
- ui.type MUST be "mixed" with 3–6 blocks unless the answer is truly trivial.
- ALWAYS include a **timeline** block with numbered LANGKAH-LANGKAH (minimum 3 steps for how-to, analysis, or recommendations).
- Include a **card** or **alert** block for ringkasan eksekutif / insight utama.
- Add a **list** block for checklist, tips, pro tips, or key facts.
- For data/comparison questions: add **stat** and/or **chart** blocks.
- **text**: 2–4 kalimat ringkasan eksekutif saja — detail utama di blocks, jangan duplikasi penuh.
- **actions**: ALWAYS 2–4 follow-up prompts (type "prompt") — anticipate next moves.
- Never give shallow one-liner answers. Never leave blocks empty for explanatory questions.
- When explaining processes: timeline + list wajib. When analyzing: card + timeline + insight alert.`;
  }

  if (powerMode === "sedang") {
    return `## RESPONSE DEPTH (MODE SEDANG)
- Structure answers clearly: use numbered steps in timeline blocks when explaining how-to or recommendations.
- Use ui.type "mixed" with 2–4 relevant blocks (timeline, list, card, alert) when the question needs depth.
- Simple factual Q → type "text" or 1 supporting block is OK.
- Include 1–3 actions (prompt) for useful follow-ups when appropriate.
- Avoid walls of text — put structure in blocks, keep text as executive summary.`;
  }

  return `## RESPONSE DEPTH (MODE HEMAT)
- Keep answers concise. ui.type "text" with blocks: [] for simple chat.
- Add 1–2 blocks only when they clearly add value (timeline for steps, list for checklist).
- actions: 0–2 max. Prioritize speed and token efficiency.`;
}

export function getPowerModeBehaviorBlock(powerMode: AgentPowerMode): string {
  if (powerMode === "max") {
    return `- **Mode Max (Jarvis)**: Jawaban harus actionable — langkah, insight, next actions. Depth over brevity.
- Anticipate kebutuan user berikutnya; berikan pro tips dan peringatan relevan.
- Gunakan tools proaktif (web_search, memory) untuk data live & konteks personal.`;
  }
  if (powerMode === "sedang") {
    return `- **Mode Sedang**: Seimbang antara kecepatan dan kedalaman — langkah jelas bila relevan.
- Gunakan tools saat user butuh data terbaru, file, atau media.`;
  }
  return `- **Mode Hemat**: Ringkas dan efisien. Tools hanya bila benar-benar diperlukan.`;
}
