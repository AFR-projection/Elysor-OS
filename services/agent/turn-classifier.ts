import type { AgentIntent } from "@/types/agent";

import type { AgentPlan } from "@/types/plan";

import type { AgentPowerMode } from "@/types/settings";

import {

  applyPowerModeToClassification,

} from "@/lib/agent-power";

import { detectIntent } from "@/services/agent/intent";

import {

  detectFileExportRequest,

  detectImageGenerationRequest,

  detectVideoGenerationRequest,

} from "@/services/agent/generation-intent";



export type TurnTier = "casual" | "standard" | "complex";



export type TurnClassification = {

  tier: TurnTier;

  intent: AgentIntent;

  skipPlanner: boolean;

  skipToolLoop: boolean;

  maxToolRounds: number;

  memoryLimit: number;

  compactPrompt: boolean;

};



const GREETING_OR_TINY =

  /^(hi|hai|halo|hello|hey|yo|assalamualaikum|waalaikumsalam|selamat\s+(pagi|siang|sore|malam)|thanks|thank you|terima kasih|makasih|ok+|oke+|sip|siap|nice|cool|lol|haha|apa\s+kabar|gimana\s+kabar|how\s+are\s+you)([\s]+[\w]{1,15})?[\s!.?]*$/i;



const LIVE_DATA =

  /\b(terbaru|latest|current|news|berita|harga|today|hari ini|2024|2025|2026|search|cari|siapa|apa itu|kapan)\b/i;



function needsHeavyPipeline(text: string, hasAttachments: boolean): boolean {

  if (hasAttachments) return true;

  if (detectImageGenerationRequest(text)) return true;

  if (detectVideoGenerationRequest(text)) return true;

  if (detectFileExportRequest(text)) return true;

  if (LIVE_DATA.test(text)) return true;

  if (text.length > 220) return true;



  const intent = detectIntent(text);

  if (intent === "coding" || intent === "research") return true;

  if (intent === "reasoning" && text.length > 100) return true;



  if (

    /\b(buat|buatkan|bikin|generate|export|pdf|excel|video|gambar|logo|code|kode|debug)\b/i.test(

      text

    )

  ) {

    return true;

  }



  if (

    /\b(bandingkan|compare|analisa|analyze|research|timeline|statistik|chart|laporan)\b/i.test(

      text

    ) &&

    text.length > 80

  ) {

    return true;

  }



  return false;

}



function classifyTurnBase(

  userMessage: string,

  hasAttachments: boolean

): TurnClassification {

  const text = userMessage.trim();

  const regexIntent = detectIntent(text);



  if (!text) {

    return {

      tier: "casual",

      intent: "general",

      skipPlanner: true,

      skipToolLoop: true,

      maxToolRounds: 0,

      memoryLimit: 0,

      compactPrompt: true,

    };

  }



  if (

    !hasAttachments &&

    !needsHeavyPipeline(text, hasAttachments) &&

    GREETING_OR_TINY.test(text)

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



  const isComplex =

    text.length > 280 ||

    (regexIntent === "research" && LIVE_DATA.test(text)) ||

    (detectFileExportRequest(text) && LIVE_DATA.test(text)) ||

    (/\b(bandingkan|compare)\b/i.test(text) &&

      /\b(vs|versus|dan|chart|statistik)\b/i.test(text)) ||

    (/\b(bandingkan|compare|analisa|analyze|prediksi|laporan|timeline)\b/i.test(

      text

    ) &&

      text.length > 120);



  if (isComplex) {

    return {

      tier: "complex",

      intent: regexIntent,

      skipPlanner: false,

      skipToolLoop: false,

      maxToolRounds: 6,

      memoryLimit: 10,

      compactPrompt: false,

    };

  }



  return {

    tier: "standard",

    intent: regexIntent,

    skipPlanner: false,

    skipToolLoop: false,

    maxToolRounds: 4,

    memoryLimit: 8,

    compactPrompt: false,

  };

}



export function classifyTurn(

  userMessage: string,

  hasAttachments: boolean,

  powerMode: AgentPowerMode = "sedang"

): TurnClassification {

  const base = classifyTurnBase(userMessage, hasAttachments);

  return applyPowerModeToClassification(

    base,

    userMessage,

    hasAttachments,

    powerMode

  );

}



export function buildInstantPlan(

  userMessage: string,

  intent: AgentIntent = "general"

): AgentPlan {

  const short = userMessage.trim().slice(0, 60);

  return {

    summary: short ? `Jawab: ${short}${short.length >= 60 ? "…" : ""}` : "Jawab langsung",

    intent,

    complexity: "simple",

    tools_needed: [],

    steps: [

      {

        id: "1",

        title: "Merespons",

        status: "running",

      },

    ],

  };

}



export function compactPlanLine(plan: AgentPlan): string {

  return `Plan: ${plan.summary} · ${plan.steps.length} langkah`;

}

