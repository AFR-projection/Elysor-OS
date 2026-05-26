/** OpenRouter STT model — see Docs multimodal openrouter.md */
export const VOICE_STT_MODEL = "openai/whisper-1";

/** OpenRouter dedicated TTS model (audio/speech endpoint) */
export const VOICE_TTS_MODEL = "openai/gpt-4o-mini-tts-2025-12-15";

export const VOICE_TTS_VOICES = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
] as const;

export type VoiceTtsVoice = (typeof VOICE_TTS_VOICES)[number];

export const DEFAULT_VOICE_TTS_VOICE: VoiceTtsVoice = "nova";

/** mp3 — supported by OpenRouter /audio/speech and all browsers */
export const DEFAULT_VOICE_TTS_FORMAT = "mp3" as const;

export type VoiceTtsFormat = "mp3" | "pcm";

export const VOICE_MIME: Record<string, VoiceTtsFormat | "webm" | "m4a" | "ogg" | "wav"> =
  {
    "audio/webm": "webm",
    "audio/webm;codecs=opus": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
  };

export function resolveSttFormat(
  mimeType: string
): "webm" | "mp3" | "wav" | "m4a" | "ogg" {
  const base = mimeType.split(";")[0]?.trim() ?? mimeType;
  const mapped = VOICE_MIME[base] ?? VOICE_MIME[mimeType];
  if (mapped === "webm" || mapped === "mp3" || mapped === "wav") return mapped;
  if (mapped === "m4a") return "m4a";
  if (mapped === "ogg") return "ogg";
  return "webm";
}

export function ttsMimeType(format: VoiceTtsFormat): string {
  switch (format) {
    case "pcm":
      return "audio/pcm";
    default:
      return "audio/mpeg";
  }
}
