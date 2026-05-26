import type { VoiceStreamEvent } from "@/types/voice";
import { resolveTimezone } from "@/lib/timezone";
import type { OpenRouterChatMessage } from "@/types/openrouter";
import {
  DEFAULT_VOICE_TTS_FORMAT,
  ttsMimeType,
  type VoiceTtsVoice,
} from "@/lib/voice/constants";
import {
  friendlyAudioError,
  shouldFallbackFromOpenRouterAudio,
} from "@/lib/voice/audio-errors";
import {
  listenWithBrowserStt,
  supportsBrowserStt,
} from "@/lib/voice/browser-stt";
import { speakWithBrowserTts } from "@/lib/voice/browser-tts";

async function transcribeViaOpenRouter(
  blob: Blob,
  language?: string
): Promise<string> {
  const form = new FormData();
  form.append(
    "audio",
    blob,
    `recording.${blob.type.includes("webm") ? "webm" : "m4a"}`
  );
  if (language) form.append("language", language);

  const response = await fetch("/api/voice/transcribe", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    let message = `Transcription failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // default
    }
    throw new Error(message);
  }

  const result = (await response.json()) as { text: string };
  return result.text.trim();
}

export async function transcribeAudioBlob(
  blob: Blob,
  language?: string,
  options?: { preferBrowser?: boolean; signal?: AbortSignal }
): Promise<string> {
  if (options?.preferBrowser && supportsBrowserStt()) {
    return listenWithBrowserStt(language, options.signal);
  }

  try {
    return await transcribeViaOpenRouter(blob, language);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transkripsi gagal";

    if (supportsBrowserStt() && shouldFallbackFromOpenRouterAudio(message)) {
      try {
        return await listenWithBrowserStt(language, options?.signal);
      } catch (browserError) {
        throw new Error(
          browserError instanceof Error
            ? browserError.message
            : friendlyAudioError(message, "stt")
        );
      }
    }

    throw new Error(friendlyAudioError(message, "stt"));
  }
}

export { listenWithBrowserStt, supportsBrowserStt };

export async function streamVoiceChat(
  messages: OpenRouterChatMessage[],
  onEvent: (event: VoiceStreamEvent) => void,
  options?: {
    conversationId?: string | null;
    timezone?: string;
    voice?: VoiceTtsVoice;
    language?: string;
    signal?: AbortSignal;
  }
): Promise<void> {
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezone = resolveTimezone(options?.timezone, browserTz);

  const response = await fetch("/api/voice/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      timezone,
      conversationId: options?.conversationId ?? null,
      voice: options?.voice,
      language: options?.language,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    let message = `Voice chat failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // default
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No voice stream from server");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (options?.signal?.aborted) {
        await reader.cancel();
        throw new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        try {
          onEvent(JSON.parse(json) as VoiceStreamEvent);
        } catch {
          // skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function streamSpeakText(
  text: string,
  onEvent: (event: VoiceStreamEvent) => void,
  options?: { voice?: VoiceTtsVoice; signal?: AbortSignal; language?: string }
): Promise<void> {
  const response = await fetch("/api/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: options?.voice }),
    signal: options?.signal,
  });

  if (!response.ok) {
    let message = `TTS failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // default
    }

    if (shouldFallbackFromOpenRouterAudio(message)) {
      await speakWithBrowserTts(
        text,
        options?.language === "en" ? "en-US" : "id-ID"
      );
      onEvent({ type: "done" });
      return;
    }

    throw new Error(friendlyAudioError(message, "tts"));
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No TTS stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let receivedAudio = false;
  let fallbackText = text;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        try {
          const event = JSON.parse(line.slice(5).trim()) as VoiceStreamEvent;
          if (event.type === "audio") receivedAudio = true;
          if (event.type === "tts_fallback") fallbackText = event.text;
          onEvent(event);
        } catch {
          // skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!receivedAudio) {
    await speakWithBrowserTts(
      fallbackText,
      options?.language === "en" ? "en-US" : "id-ID"
    );
    onEvent({ type: "done" });
  }
}

export function decodeBase64Audio(
  chunks: string[],
  format = DEFAULT_VOICE_TTS_FORMAT
): Blob {
  const parts: Uint8Array[] = [];

  for (const chunk of chunks) {
    if (!chunk) continue;
    const binary = atob(chunk);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    parts.push(bytes);
  }

  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }

  return new Blob([merged], { type: ttsMimeType(format) });
}

export async function playAudioBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memutar audio"));
    };
    void audio.play().catch(reject);
  });
}
