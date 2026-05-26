"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStreamingAudioPlayer } from "@/hooks/use-streaming-audio-player";
import { useVoiceVad } from "@/hooks/use-voice-vad";
import { resolveTimezone } from "@/lib/timezone";
import { SESSION_LABELS } from "@/lib/voice/vad-config";
import {
  speakWithBrowserTts,
  stopBrowserTts,
  unlockBrowserAudio,
} from "@/lib/voice/browser-tts";
import { streamVoiceChat, transcribeAudioBlob } from "@/lib/voice-client";
import type { VoiceSessionPhase } from "@/types/voice";
import type { OpenRouterChatMessage } from "@/types/openrouter";
import type { PreferredLanguage } from "@/types/settings";

type VoiceSessionOptions = {
  timezone: string | null;
  preferredLanguage: PreferredLanguage;
  conversationId: string | null;
  onConversationId: (id: string) => void;
  onRefresh: () => void;
  onError: (message: string) => void;
};

export function useVoiceSession(options: VoiceSessionOptions) {
  const [sessionActive, setSessionActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [phase, setPhase] = useState<VoiceSessionPhase>("connecting");
  const [statusLabel, setStatusLabel] = useState<string>(
    SESSION_LABELS.connecting
  );
  const [userCaption, setUserCaption] = useState("");
  const [agentCaption, setAgentCaption] = useState("");
  const [micLevel, setMicLevel] = useState(0);

  const historyRef = useRef<OpenRouterChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const phaseRef = useRef<VoiceSessionPhase>("connecting");
  const turnIdRef = useRef(0);
  const voiceEnabledRef = useRef(true);
  const startingRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const vad = useVoiceVad();
  const player = useStreamingAudioPlayer();

  const setPhaseSafe = useCallback((next: VoiceSessionPhase, label?: string) => {
    phaseRef.current = next;
    setPhase(next);
    setStatusLabel(label ?? SESSION_LABELS[next] ?? "");
  }, []);

  const resumeListeningPhase = useCallback(() => {
    if (!voiceEnabledRef.current) {
      setPhaseSafe("voice_off");
    } else {
      setPhaseSafe("listening");
    }
  }, [setPhaseSafe]);

  const processUtterance = useCallback(
    async (blob: Blob) => {
      if (!voiceEnabledRef.current) return;

      const turnId = ++turnIdRef.current;
      const opts = optionsRef.current;

      vad.pauseDetection();
      setPhaseSafe("transcribing");

      try {
        const text = await transcribeAudioBlob(
          blob,
          opts.preferredLanguage === "auto" ? undefined : opts.preferredLanguage
        );

        if (turnId !== turnIdRef.current) return;

        if (!text.trim()) {
          if (voiceEnabledRef.current) vad.resumeDetection();
          resumeListeningPhase();
          return;
        }

        setUserCaption(text);
        if (voiceEnabledRef.current) vad.resumeDetection();

        const userMessage: OpenRouterChatMessage = {
          role: "user",
          content: text,
        };
        const messages = [...historyRef.current, userMessage];

        setAgentCaption("");
        setPhaseSafe("thinking");

        abortRef.current?.abort();
        abortRef.current = new AbortController();
        player.reset();

        let agentText = "";
        let receivedAudio = false;
        let ttsFallbackText = "";

        await streamVoiceChat(
          messages,
          (event) => {
            if (turnId !== turnIdRef.current) return;

            if (event.type === "phase") {
              if (event.phase === "speaking") {
                setPhaseSafe("speaking", event.label);
              } else if (event.phase === "thinking") {
                setPhaseSafe("thinking", event.label);
              }
            }

            if (event.type === "agent_delta") {
              agentText += event.content;
              setAgentCaption(agentText);
            }

            if (event.type === "agent_done") {
              agentText = event.content;
              setAgentCaption(agentText);
              if (event.meta?.conversationId) {
                opts.onConversationId(event.meta.conversationId);
              }
            }

            if (event.type === "audio") {
              receivedAudio = true;
              player.appendChunk(event.data);
            }

            if (event.type === "tts_fallback") {
              ttsFallbackText = event.text;
            }

            if (event.type === "error") {
              throw new Error(event.message);
            }

            if (event.type === "done") {
              historyRef.current = [
                ...messages,
                { role: "assistant", content: agentText },
              ];
            }
          },
          {
            conversationId: opts.conversationId,
            timezone: resolveTimezone(
              opts.timezone,
              Intl.DateTimeFormat().resolvedOptions().timeZone
            ),
            language:
              opts.preferredLanguage === "auto"
                ? undefined
                : opts.preferredLanguage,
            signal: abortRef.current.signal,
          }
        );

        if (turnId !== turnIdRef.current) return;

        if (!receivedAudio) {
          const speakText = ttsFallbackText || agentText;
          if (!speakText.trim()) {
            throw new Error("TTS gagal — tidak ada teks untuk dibacakan.");
          }
          setPhaseSafe("speaking", "Browser TTS…");
          await speakWithBrowserTts(
            speakText,
            opts.preferredLanguage === "en" ? "en-US" : "id-ID"
          );
        } else {
          setPhaseSafe("speaking");
          try {
            await player.playBuffered();
          } catch (playError) {
            const playMessage =
              playError instanceof Error ? playError.message : "Gagal memutar audio";
            opts.onError(`${playMessage} — fallback browser TTS…`);
            await speakWithBrowserTts(
              agentText,
              opts.preferredLanguage === "en" ? "en-US" : "id-ID"
            );
          }
        }

        if (turnId !== turnIdRef.current) return;

        opts.onRefresh();
        resumeListeningPhase();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (turnId !== turnIdRef.current) return;

        const message =
          error instanceof Error ? error.message : "Voice chat gagal";
        opts.onError(message);
        if (voiceEnabledRef.current) vad.resumeDetection();
        if (phaseRef.current !== "idle") {
          resumeListeningPhase();
        }
      }
    },
    [player, resumeListeningPhase, setPhaseSafe, vad]
  );

  const handleSpeechStart = useCallback(() => {
    if (!voiceEnabledRef.current) return;

    const current = phaseRef.current;

    if (current === "speaking" || current === "thinking") {
      turnIdRef.current += 1;
      abortRef.current?.abort();
      player.stop();
    }

    if (
      current === "listening" ||
      current === "speaking" ||
      current === "thinking" ||
      current === "voice_off"
    ) {
      setPhaseSafe("user_speaking");
    }
  }, [player, setPhaseSafe]);

  const startSession = useCallback(async () => {
    if (sessionActive || startingRef.current) return;
    startingRef.current = true;

    setPhaseSafe("connecting");
    setUserCaption("");
    setAgentCaption("");
    voiceEnabledRef.current = true;
    setVoiceEnabled(true);

    try {
      await vad.start({
        onUtterance: (blob) => void processUtterance(blob),
        onSpeechStart: handleSpeechStart,
        onSpeechEnd: () => {
          if (phaseRef.current === "user_speaking") {
            resumeListeningPhase();
          }
        },
        onLevel: (level) => {
          if (voiceEnabledRef.current) setMicLevel(level);
        },
      });

      await unlockBrowserAudio();

      setSessionActive(true);
      setPhaseSafe("listening");
    } catch {
      optionsRef.current.onError("Izinkan akses mikrofon di browser");
      setPhaseSafe("idle");
    } finally {
      startingRef.current = false;
    }
  }, [
    handleSpeechStart,
    processUtterance,
    resumeListeningPhase,
    sessionActive,
    setPhaseSafe,
    vad,
  ]);

  const stopSession = useCallback(() => {
    turnIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    player.stop();
    stopBrowserTts();
    vad.stop();
    setSessionActive(false);
    voiceEnabledRef.current = true;
    setVoiceEnabled(true);
    setMicLevel(0);
    setPhaseSafe("idle");
  }, [player, setPhaseSafe, vad]);

  const setVoiceOn = useCallback(
    (enabled: boolean) => {
      if (!sessionActive) return;

      voiceEnabledRef.current = enabled;
      setVoiceEnabled(enabled);

      if (enabled) {
        vad.resumeDetection();
        if (
          phaseRef.current === "voice_off" ||
          phaseRef.current === "listening"
        ) {
          setPhaseSafe("listening");
        }
      } else {
        vad.pauseDetection();
        setMicLevel(0);
        if (
          phaseRef.current === "listening" ||
          phaseRef.current === "user_speaking"
        ) {
          setPhaseSafe("voice_off");
        }
      }
    },
    [sessionActive, setPhaseSafe, vad]
  );

  const toggleVoice = useCallback(() => {
    setVoiceOn(!voiceEnabledRef.current);
  }, [setVoiceOn]);

  const startRef = useRef(startSession);
  const stopRef = useRef(stopSession);
  startRef.current = startSession;
  stopRef.current = stopSession;

  useEffect(() => {
    void startRef.current();
    return () => stopRef.current();
  }, []);

  const displayLevel =
    !voiceEnabled
      ? 0.03
      : phase === "speaking"
        ? Math.max(player.playbackLevel, micLevel * 0.25)
        : phase === "user_speaking" || phase === "listening"
          ? micLevel
          : phase === "thinking"
            ? 0.07
            : sessionActive
              ? 0.045
              : 0.02;

  return {
    sessionActive,
    voiceEnabled,
    phase,
    statusLabel,
    userCaption,
    agentCaption,
    micLevel,
    playbackLevel: player.playbackLevel,
    displayLevel,
    micAnalyserRef: vad.analyserRef,
    playbackAnalyserRef: player.analyserRef,
    isCapturingSpeech: vad.isCapturingSpeech,
    toggleVoice,
    setVoiceOn,
  };
}
