import { ensureVipStructuredOutput } from "../lib/chart-enrichment";
import { parseAgentResponse } from "../services/agent/response-parser";

const sampleJson = `\`\`\`json
{
  "text": "Berikut perbandingan React vs Vue dengan chart.",
  "ui": {
    "type": "mixed",
    "blocks": [
      {
        "type": "chart",
        "title": "Skor Metrik",
        "chartType": "bar",
        "data": [
          { "label": "React", "value": 92 },
          { "label": "Vue", "value": "88" }
        ]
      },
      {
        "type": "chart",
        "title": "Tren",
        "chartType": "line",
        "data": [
          { "name": "2022", "value": 70 },
          { "name": "2024", "value": 91 }
        ]
      }
    ]
  },
  "actions": []
}
\`\`\``;

const meta = {
  model: "test/model",
  modelLabel: "Test",
  intent: "general" as const,
  routingReason: "test",
};

const parsed = parseAgentResponse(sampleJson, meta, []);
if (parsed.ui.blocks.filter((b) => b.type === "chart").length !== 2) {
  console.error("FAIL: expected 2 chart blocks, got", parsed.ui.blocks.length);
  process.exit(1);
}

const textOnly = parseAgentResponse(
  '{"text":"Ringkasan saja tanpa blocks","ui":{"type":"text","blocks":[]},"actions":[]}',
  meta,
  []
);
const enriched = ensureVipStructuredOutput(
  textOnly,
  "Bandingkan React vs Vue (chart)"
);
if (!enriched.ui.blocks.some((b) => b.type === "chart")) {
  console.error("FAIL: chart enrichment did not add charts");
  process.exit(1);
}

console.log("OK: response-parser charts + VIP enrichment");
