export type UIResponseType =
  | "text"
  | "dashboard"
  | "cards"
  | "timeline"
  | "chart"
  | "mixed";

export type BlockVariant = "default" | "success" | "warning" | "danger" | "info";

export interface StatBlock {
  type: "stat";
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

export interface CardBlock {
  type: "card";
  title: string;
  description?: string;
  items?: string[];
  variant?: BlockVariant;
}

export interface TimelineEvent {
  time: string;
  title: string;
  description?: string;
}

export interface TimelineBlock {
  type: "timeline";
  title?: string;
  events: TimelineEvent[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartBlock {
  type: "chart";
  title?: string;
  chartType?: "bar" | "line";
  data: ChartDataPoint[];
}

export interface AlertBlock {
  type: "alert";
  message: string;
  variant?: BlockVariant;
  title?: string;
}

export interface ListBlock {
  type: "list";
  title?: string;
  items: Array<{ label: string; value?: string }>;
}

export interface CodeBlock {
  type: "code";
  language?: string;
  code: string;
}

export type UIBlock =
  | StatBlock
  | CardBlock
  | TimelineBlock
  | ChartBlock
  | AlertBlock
  | ListBlock
  | CodeBlock;

export interface UIResponseLayout {
  type: UIResponseType;
  blocks: UIBlock[];
}

export type ActionType = "link" | "prompt" | "copy";

export interface AgentAction {
  id: string;
  label: string;
  type: ActionType;
  value: string;
}

export interface AgentStructuredResponse {
  text: string;
  ui: UIResponseLayout;
  actions: AgentAction[];
  model_used?: string;
  model_label?: string;
  tools_used?: string[];
}
