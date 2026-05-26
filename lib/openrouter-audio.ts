import {
  DEFAULT_VOICE_TTS_FORMAT,
  DEFAULT_VOICE_TTS_VOICE,
  VOICE_STT_MODEL,
  VOICE_TTS_MODEL,
  type VoiceTtsFormat,
  type VoiceTtsVoice,
} from "@/lib/voice/constants";

const OPENROUTER_STT_URL = "https://openrouter.ai/api/v1/audio/transcriptions";
const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";

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

export type TranscribeInput = {
  data: string;
  format: string;
  language?: string;
};

export async function transcribeWithOpenRouter(
  input: TranscribeInput
): Promise<{ text: string }> {
  const response = await fetch(OPENROUTER_STT_URL, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify({
      model: VOICE_STT_MODEL,
      input_audio: {
        data: input.data,
        format: input.format,
      },
      ...(input.language ? { language: input.language } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter STT error (${response.status}): ${errorBody}`
    );
  }

  const result = (await response.json()) as { text?: string };
  return { text: result.text?.trim() ?? "" };
}

export type StreamSpeechOptions = {
  voice?: VoiceTtsVoice;
  format?: VoiceTtsFormat;
  signal?: AbortSignal;
};

/**
 * Stream TTS from OpenRouter /audio/speech (raw audio bytes → base64 chunks).
 */
export async function* streamSpeechFromOpenRouter(
  text: string,
  options: StreamSpeechOptions = {}
): AsyncGenerator<
  { kind: "audio"; data: string } | { kind: "transcript"; content: string }
> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("TTS input text is empty");
  }

  const voice = options.voice ?? DEFAULT_VOICE_TTS_VOICE;
  const format = options.format ?? DEFAULT_VOICE_TTS_FORMAT;

  const response = await fetch(OPENROUTER_SPEECH_URL, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    signal: options.signal,
    body: JSON.stringify({
      model: VOICE_TTS_MODEL,
      input: trimmed,
      voice,
      response_format: format,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter TTS error (${response.status}): ${errorBody}`
    );
  }

  if (!response.body) {
    throw new Error("OpenRouter TTS returned an empty response body");
  }

  const reader = response.body.getReader();
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.length) continue;

      totalBytes += value.length;
      yield { kind: "audio", data: Buffer.from(value).toString("base64") };
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) {
    throw new Error("OpenRouter TTS returned no audio data");
  }
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}
