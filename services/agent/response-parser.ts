import type { AgentMeta } from "@/types/agent";
import type {
  AgentAction,
  AgentStructuredResponse,
  UIBlock,
  UIResponseType,
} from "@/types/ui-response";

const VALID_UI_TYPES: UIResponseType[] = [
  "text",
  "dashboard",
  "cards",
  "timeline",
  "chart",
  "mixed",
];

function extractJsonCandidate(raw: string): string | null {
  const trimmed = raw.trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return null;
}

function sanitizeBlock(raw: unknown): UIBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const block = raw as Record<string, unknown>;
  const type = block.type;

  switch (type) {
    case "stat":
      if (typeof block.label !== "string" || typeof block.value !== "string") {
        return null;
      }
      return {
        type: "stat",
        label: block.label,
        value: block.value,
        change: typeof block.change === "string" ? block.change : undefined,
        trend:
          block.trend === "up" || block.trend === "down" || block.trend === "neutral"
            ? block.trend
            : undefined,
        icon: typeof block.icon === "string" ? block.icon : undefined,
      };
    case "card":
      if (typeof block.title !== "string") return null;
      return {
        type: "card",
        title: block.title,
        description:
          typeof block.description === "string" ? block.description : undefined,
        items: Array.isArray(block.items)
          ? block.items.filter((i): i is string => typeof i === "string")
          : undefined,
        variant: isVariant(block.variant) ? block.variant : undefined,
      };
    case "timeline":
      if (!Array.isArray(block.events)) return null;
      return {
        type: "timeline",
        title: typeof block.title === "string" ? block.title : undefined,
        events: block.events
          .filter(
            (e): e is { time: string; title: string; description?: string } =>
              !!e &&
              typeof e === "object" &&
              typeof (e as Record<string, unknown>).time === "string" &&
              typeof (e as Record<string, unknown>).title === "string"
          )
          .map((e) => ({
            time: e.time,
            title: e.title,
            description:
              typeof e.description === "string" ? e.description : undefined,
          })),
      };
    case "chart": {
      if (!Array.isArray(block.data)) return null;
      const points = block.data
        .map((raw) => {
          if (!raw || typeof raw !== "object") return null;
          const row = raw as Record<string, unknown>;
          const label =
            typeof row.label === "string"
              ? row.label
              : typeof row.name === "string"
                ? row.name
                : null;
          const rawValue = row.value;
          const value =
            typeof rawValue === "number"
              ? rawValue
              : typeof rawValue === "string"
                ? Number.parseFloat(rawValue.replace(/[^\d.-]/g, ""))
                : NaN;
          if (!label || Number.isNaN(value)) return null;
          return { label, value };
        })
        .filter((d): d is { label: string; value: number } => d !== null);

      if (points.length === 0) return null;

      return {
        type: "chart",
        title: typeof block.title === "string" ? block.title : undefined,
        chartType:
          block.chartType === "bar" || block.chartType === "line"
            ? block.chartType
            : "bar",
        data: points,
      };
    }
    case "alert":
      if (typeof block.message !== "string") return null;
      return {
        type: "alert",
        message: block.message,
        title: typeof block.title === "string" ? block.title : undefined,
        variant: isVariant(block.variant) ? block.variant : undefined,
      };
    case "list":
      if (!Array.isArray(block.items)) return null;
      return {
        type: "list",
        title: typeof block.title === "string" ? block.title : undefined,
        items: block.items
          .filter(
            (i): i is { label: string; value?: string } =>
              !!i &&
              typeof i === "object" &&
              typeof (i as Record<string, unknown>).label === "string"
          )
          .map((i) => ({
            label: i.label,
            value: typeof i.value === "string" ? i.value : undefined,
          })),
      };
    case "code":
      if (typeof block.code !== "string") return null;
      return {
        type: "code",
        code: block.code,
        language:
          typeof block.language === "string" ? block.language : undefined,
      };
    default:
      return null;
  }
}

function isVariant(v: unknown): v is "default" | "success" | "warning" | "danger" | "info" {
  return (
    v === "default" ||
    v === "success" ||
    v === "warning" ||
    v === "danger" ||
    v === "info"
  );
}

function sanitizeActions(raw: unknown): AgentAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (a): a is AgentAction =>
        !!a &&
        typeof a === "object" &&
        typeof (a as AgentAction).id === "string" &&
        typeof (a as AgentAction).label === "string" &&
        typeof (a as AgentAction).value === "string" &&
        ((a as AgentAction).type === "link" ||
          (a as AgentAction).type === "prompt" ||
          (a as AgentAction).type === "copy")
    )
    .slice(0, 6);
}

function inferUiType(blocks: UIBlock[]): UIResponseType {
  if (blocks.length === 0) return "text";
  const types = new Set(blocks.map((b) => b.type));
  if (types.size > 1) return "mixed";
  if (types.has("stat")) return "dashboard";
  if (types.has("card")) return "cards";
  if (types.has("timeline")) return "timeline";
  if (types.has("chart")) return "chart";
  return "mixed";
}

/**
 * Parse model output into structured PAIOS response.
 * Falls back to plain text if JSON is invalid.
 */
export function parseAgentResponse(
  raw: string,
  meta: AgentMeta,
  toolsUsed: string[] = []
): AgentStructuredResponse {
  const fallback: AgentStructuredResponse = {
    text: raw.trim(),
    ui: { type: "text", blocks: [] },
    actions: [],
    model_used: meta.model,
    model_label: meta.modelLabel,
    tools_used: toolsUsed,
  };

  if (!raw.trim()) return fallback;

  const candidate = extractJsonCandidate(raw);
  if (!candidate) return fallback;

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const text =
      typeof parsed.text === "string" && parsed.text.trim()
        ? parsed.text.trim()
        : fallback.text;

    const uiRaw = parsed.ui as Record<string, unknown> | undefined;
    const blocksRaw = Array.isArray(uiRaw?.blocks) ? uiRaw.blocks : [];
    const blocks = blocksRaw
      .map(sanitizeBlock)
      .filter((b): b is UIBlock => b !== null)
      .slice(0, 12);

    const uiType =
      typeof uiRaw?.type === "string" &&
      VALID_UI_TYPES.includes(uiRaw.type as UIResponseType)
        ? (uiRaw.type as UIResponseType)
        : inferUiType(blocks);

    return {
      text,
      ui: { type: blocks.length > 0 ? uiType : "text", blocks },
      actions: sanitizeActions(parsed.actions),
      model_used: meta.model,
      model_label: meta.modelLabel,
      tools_used: toolsUsed,
    };
  } catch {
    return fallback;
  }
}
