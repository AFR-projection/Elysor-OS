import type { OpenRouterContentPart } from "@/types/multimodal";

export type OpenRouterRole = "system" | "user" | "assistant" | "tool";

export interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export type OpenRouterMessageContent =
  | string
  | null
  | OpenRouterContentPart[];

export interface OpenRouterChatMessage {
  role: OpenRouterRole;
  content?: OpenRouterMessageContent;
  tool_calls?: OpenRouterToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface OpenRouterChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: OpenRouterToolCall[];
    };
    finish_reason: string;
  }>;
  model: string;
}

export type OpenRouterPdfPlugin = {
  id: "file-parser";
  pdf: {
    engine: "cloudflare-ai" | "mistral-ocr" | "native";
  };
};

export type OpenRouterPlugin = OpenRouterPdfPlugin;
