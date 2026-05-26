import type { AgentIntent } from "@/types/agent";

export function buildPlannerPrompt(input: {
  userMessage: string;
  fallbackIntent: AgentIntent;
  enabledTools: string[];
  memoryPreview?: string;
  userLanguage?: string;
}): string {
  const toolsList = input.enabledTools.join(", ");

  return `You are the PAIOS planning module. Analyze the user request and produce a concise execution plan BEFORE the main agent responds.

Return ONLY valid JSON (no markdown outside json block):
{
  "summary": "one sentence plan summary in user's language",
  "intent": "general|reasoning|coding|research",
  "complexity": "simple|moderate|complex",
  "tools_needed": ["tool_name"],
  "approach": "brief strategy",
  "steps": [
    { "id": "1", "title": "step title", "description": "optional", "tool": "web_search|null" }
  ]
}

Rules:
- intent: pick the best match — coding for code/debug, research for live/current facts, reasoning for analysis/compare, multimodal for image/video/PDF analysis, general for casual chat
- If user asks to BUAT/GENERATE gambar/logo/ilustrasi → tools_needed MUST include "image_generate"
- If user asks for video in any form (buat/ingin/mau/generate/tentang video) → tools_needed MUST include "video_generate" and a step with tool "video_generate"
- If user asks to export/kirim/download/buat laporan/dokumen in PDF, Excel, XLSX, CSV, or any file format → tools_needed MUST include "web_search" (if live data needed) AND "file_export" with a final step tool "file_export"
- complexity: simple (1 step), moderate (2-4 steps), complex (5+ steps)
- tools_needed: subset of available tools only: ${toolsList}
- steps: 1-6 actionable steps; set "tool" when a step needs a specific tool, null otherwise
- Use the same language as the user (${input.userLanguage ?? "auto"})
- Preliminary intent hint: ${input.fallbackIntent}
${input.memoryPreview ? `- Relevant memory context: ${input.memoryPreview.slice(0, 400)}` : ""}

User message:
"""
${input.userMessage}
"""`;
}
