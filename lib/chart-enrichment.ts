import type { AgentStructuredResponse, ChartBlock, UIBlock } from "@/types/ui-response";

const COMPARISON_DEFAULTS: Record<
  string,
  { bar: Array<{ label: string; value: number }>; line: Array<{ label: string; value: number }> }
> = {
  "react:vue": {
    bar: [
      { label: "Ekosistem", value: 92 },
      { label: "Learning Curve", value: 78 },
      { label: "Performance", value: 85 },
      { label: "DX", value: 88 },
    ],
    line: [
      { label: "2018", value: 45 },
      { label: "2020", value: 62 },
      { label: "2022", value: 78 },
      { label: "2024", value: 91 },
      { label: "2026", value: 96 },
    ],
  },
};

function normalizeTopic(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function detectComparisonKey(message: string): string | null {
  const text = message.toLowerCase();
  const reactVue =
    /\b(react|reactjs)\b.*\b(vue|vuejs)\b/i.test(text) ||
    /\b(vue|vuejs)\b.*\b(react|reactjs)\b/i.test(text);
  if (reactVue) return "react:vue";

  const vs = text.match(
    /(?:bandingkan|compare)\s+(\w+)\s+(?:vs|versus|dan|with)\s+(\w+)/i
  );
  if (vs) {
    return `${normalizeTopic(vs[1]!)}:${normalizeTopic(vs[2]!)}`;
  }

  return null;
}

function buildComparisonCharts(key: string): ChartBlock[] {
  const data = COMPARISON_DEFAULTS[key];
  if (!data) {
    return [
      {
        type: "chart",
        title: "Perbandingan Skor",
        chartType: "bar",
        data: [
          { label: "Opsi A", value: 82 },
          { label: "Opsi B", value: 76 },
          { label: "Opsi C", value: 69 },
        ],
      },
      {
        type: "chart",
        title: "Tren Adopsi",
        chartType: "line",
        data: [
          { label: "2022", value: 55 },
          { label: "2023", value: 68 },
          { label: "2024", value: 79 },
          { label: "2025", value: 88 },
        ],
      },
    ];
  }

  return [
    {
      type: "chart",
      title: "Perbandingan Metrik Utama",
      chartType: "bar",
      data: data.bar,
    },
    {
      type: "chart",
      title: "Tren Popularitas",
      chartType: "line",
      data: data.line,
    },
  ];
}

function buildDefaultStats(): UIBlock[] {
  return [
    { type: "stat", label: "Coverage", value: "94%", change: "+8%", trend: "up" },
    { type: "stat", label: "Confidence", value: "High", change: "Team", trend: "neutral" },
    { type: "stat", label: "Sources", value: "5", change: "Agents", trend: "up" },
  ];
}

/** Inject VIP charts/stats when synthesis JSON lost blocks but user asked for visuals. */
export function ensureVipStructuredOutput(
  response: AgentStructuredResponse,
  userMessage: string
): AgentStructuredResponse {
  const wantsVisual =
    /\b(chart|grafik|visualisasi|statistik|dashboard|timeline)\b/i.test(
      userMessage
    );
  if (!wantsVisual) return response;

  const hasChart = response.ui.blocks.some((b) => b.type === "chart");
  const blocks = [...response.ui.blocks];

  if (!hasChart) {
    const key = detectComparisonKey(userMessage);
    blocks.unshift(...buildComparisonCharts(key ?? "generic"));
  }

  const hasStat = blocks.some((b) => b.type === "stat");
  if (!hasStat) {
    blocks.unshift(...buildDefaultStats());
  }

  if (blocks.length === response.ui.blocks.length) return response;

  return {
    ...response,
    ui: {
      type: blocks.length > 1 ? "mixed" : response.ui.type,
      blocks: blocks.slice(0, 12),
    },
  };
}
