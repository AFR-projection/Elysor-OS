import type { OpenRouterChatMessage } from "@/types/openrouter";
import type { OpenRouterPlugin } from "@/types/openrouter";
import type { OpenRouterTool } from "@/types/tools";
import { FALLBACK_MODEL, isModelUnavailableError } from "@/lib/models";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ChatCompletionOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: OpenRouterTool[];
  tool_choice?: "auto" | "none" | "required";
  plugins?: OpenRouterPlugin[];
};

export type OpenRouterCompletionResponse = {
  choices?: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    server_tool_use?: {
      web_search_requests?: number;
    };
  };
};

function getOpenRouterHeaders(): HeadersInit {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
    "X-Title": "PAIOS",
  };
}

function buildRequestBody(
  messages: OpenRouterChatMessage[],
  options: ChatCompletionOptions,
  stream: boolean
) {
  return {
    model: options.model ?? "openai/gpt-4o-mini",
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens,
    stream,
    ...(options.tools?.length
      ? { tools: options.tools, tool_choice: options.tool_choice ?? "auto" }
      : {}),
    ...(options.plugins?.length ? { plugins: options.plugins } : {}),
  };
}

/**
 * Send a chat completion request to OpenRouter.
 * Falls back to Gemini Flash if the routed model is unavailable.
 */
export async function chatCompletion(
  messages: OpenRouterChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<OpenRouterCompletionResponse> {
  const model = options.model ?? FALLBACK_MODEL;

  try {
    return await chatCompletionRaw(messages, { ...options, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (model !== FALLBACK_MODEL && isModelUnavailableError(message)) {
      console.warn(
        `[openrouter] Model ${model} unavailable — falling back to ${FALLBACK_MODEL}`
      );
      return chatCompletionRaw(messages, { ...options, model: FALLBACK_MODEL });
    }
    throw error;
  }
}

async function chatCompletionRaw(
  messages: OpenRouterChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<OpenRouterCompletionResponse> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify(buildRequestBody(messages, options, false)),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter API error (${response.status}): ${errorBody}`
    );
  }

  return response.json() as Promise<OpenRouterCompletionResponse>;
}

/**
 * Stream a chat completion from OpenRouter (SSE).
 * Falls back to Gemini Flash if the routed model is unavailable.
 */
export async function streamChatCompletion(
  messages: OpenRouterChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<Response> {
  const model = options.model ?? FALLBACK_MODEL;

  try {
    return await streamChatCompletionRaw(messages, { ...options, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (model !== FALLBACK_MODEL && isModelUnavailableError(message)) {
      console.warn(
        `[openrouter] Stream model ${model} unavailable — falling back to ${FALLBACK_MODEL}`
      );
      return streamChatCompletionRaw(messages, {
        ...options,
        model: FALLBACK_MODEL,
      });
    }
    throw error;
  }
}

async function streamChatCompletionRaw(
  messages: OpenRouterChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<Response> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify(buildRequestBody(messages, options, true)),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter API error (${response.status}): ${errorBody}`
    );
  }

  if (!response.body) {
    throw new Error("OpenRouter returned an empty response body");
  }

  return response;
}

/** Parse OpenRouter SSE chunks into text deltas */
export async function* parseOpenRouterStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function getWebSearchRequestCount(
  response: OpenRouterCompletionResponse
): number {
  return response.usage?.server_tool_use?.web_search_requests ?? 0;
}
