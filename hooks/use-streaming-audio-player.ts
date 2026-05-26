"use client";

import { useCallback, useRef, useState } from "react";
import {
  decodeBase64Audio,
} from "@/lib/voice-client";
import { DEFAULT_VOICE_TTS_FORMAT } from "@/lib/voice/constants";

export function useStreamingAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackLevel, setPlaybackLevel] = useState(0);
  const chunksRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rejectRef = useRef<((reason?: unknown) => void) | null>(null);

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPlaybackLevel(0);
  }, []);

  const stop = useCallback(() => {
    stopMeter();
    if (rejectRef.current) {
      rejectRef.current(new DOMException("Aborted", "AbortError"));
      rejectRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    void ctxRef.current?.close();
    ctxRef.current = null;
    analyserRef.current = null;
    chunksRef.current = [];
    setIsPlaying(false);
  }, [stopMeter]);

  const reset = useCallback(() => {
    stop();
  }, [stop]);

  const appendChunk = useCallback((data: string) => {
    chunksRef.current.push(data);
  }, []);

  const playBuffered = useCallback(async () => {
    if (chunksRef.current.length === 0) {
      throw new Error("Tidak ada audio TTS untuk diputar");
    }

    const savedChunks = [...chunksRef.current];
    stop();
    chunksRef.current = savedChunks;

    const blob = decodeBase64Audio(chunksRef.current, DEFAULT_VOICE_TTS_FORMAT);
    chunksRef.current = [];

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(true);

    try {
      const ctx = new AudioContext();
      await ctx.resume();
      ctxRef.current = ctx;
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!audioRef.current || audio.paused) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i]!;
        setPlaybackLevel(sum / data.length / 255);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      await new Promise<void>((resolve, reject) => {
        rejectRef.current = reject;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          rejectRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          rejectRef.current = null;
          reject(new Error("Gagal memutar suara agent"));
        };
        void audio.play().catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            reject(
              new Error(
                "Browser memblokir autoplay — ketuk layar atau tombol mic sekali"
              )
            );
            return;
          }
          reject(err);
        });
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      throw error;
    } finally {
      stopMeter();
      analyserRef.current = null;
      setIsPlaying(false);
    }
  }, [stop, stopMeter]);

  return {
    isPlaying,
    playbackLevel,
    analyserRef,
    appendChunk,
    playBuffered,
    reset,
    stop,
  };
}
