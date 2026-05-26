"use client";

import { useCallback, useRef, useState } from "react";
import { transcribeAudioBlob } from "@/lib/voice-client";
import { listenWithBrowserStt, supportsBrowserStt } from "@/lib/voice/browser-stt";
import { shouldFallbackFromOpenRouterAudio } from "@/lib/voice/audio-errors";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

type SmartVoiceOptions = {
  language?: string;
  onTranscript: (text: string) => void | Promise<void>;
  onError: (message: string) => void;
  onListening?: () => void;
  onTranscribing?: () => void;
};

/**
 * Record-first voice input: tap to record, tap again to transcribe.
 * OpenRouter STT first, Browser STT fallback on billing/network issues.
 */
export function useSmartVoiceInput(options: SmartVoiceOptions) {
  const recorder = useVoiceRecorder();
  const [isBusy, setIsBusy] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const transcribeBlob = useCallback(async (blob: Blob, language?: string) => {
    try {
      return await transcribeAudioBlob(blob, language);
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : "Transkripsi gagal";

      if (supportsBrowserStt() && shouldFallbackFromOpenRouterAudio(message)) {
        optionsRef.current.onListening?.();
        return listenWithBrowserStt(language);
      }

      throw apiError;
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isBusy) return;

    if (!recorder.isRecording) {
      try {
        await recorder.start();
        optionsRef.current.onListening?.();
      } catch {
        optionsRef.current.onError("Izinkan akses mikrofon di browser");
      }
      return;
    }

    setIsBusy(true);
    optionsRef.current.onTranscribing?.();

    try {
      const result = await recorder.stop();
      if (!result || result.blob.size < 800) {
        optionsRef.current.onError("Suara terlalu pendek — coba lagi");
        return;
      }

      const text = await transcribeBlob(result.blob, optionsRef.current.language);
      if (!text.trim()) {
        optionsRef.current.onError("Tidak terdengar jelas — coba bicara lebih jelas");
        return;
      }

      await optionsRef.current.onTranscript(text);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      const message = error instanceof Error ? error.message : "Transkripsi gagal";
      if (message.includes("network") || message.includes("Browser STT")) {
        optionsRef.current.onError(
          "Speech browser terblokir. Tap mic → rekam → tap lagi, atau ketik manual."
        );
      } else {
        optionsRef.current.onError(message);
      }
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, recorder, transcribeBlob]);

  const cancel = useCallback(() => {
    recorder.cancel();
    setIsBusy(false);
  }, [recorder]);

  return {
    toggle,
    cancel,
    isRecording: recorder.isRecording,
    isBusy,
    level: recorder.level,
  };
}
