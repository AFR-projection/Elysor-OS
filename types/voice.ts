import type { AgentMeta } from "@/types/agent";
import type { VoiceTtsVoice } from "@/lib/voice/constants";

export type VoiceSessionPhase =
  | "idle"
  | "connecting"
  | "listening"
  | "voice_off"
  | "user_speaking"
  | "transcribing"
  | "thinking"
  | "speaking";

export type VoiceStreamEvent =
  | { type: "user_transcript"; text: string }
  | { type: "phase"; phase: string; label?: string }
  | { type: "agent_delta"; content: string }
  | { type: "agent_done"; content: string; meta?: AgentMeta }
  | { type: "audio"; data: string }
  | { type: "tts_transcript"; content: string }
  | { type: "tts_fallback"; text: string; reason?: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type VoiceChatRequest = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  timezone?: string;
  conversationId?: string | null;
  voice?: VoiceTtsVoice;
  language?: string;
};

export type TranscribeResponse = {
  text: string;
};
