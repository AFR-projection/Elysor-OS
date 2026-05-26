"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VAD_CONFIG } from "@/lib/voice/vad-config";

export type VoiceVadCallbacks = {
  onUtterance: (blob: Blob) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onLevel?: (level: number) => void;
};

function computeRms(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i]! - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

export function useVoiceVad() {
  const [level, setLevel] = useState(0);
  const [isCapturingSpeech, setIsCapturingSpeech] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("audio/webm");
  const rafRef = useRef<number | null>(null);
  const callbacksRef = useRef<VoiceVadCallbacks | null>(null);
  const enabledRef = useRef(false);
  const capturingRef = useRef(false);
  const speechFrameRef = useRef(0);
  const silenceStartRef = useRef<number | null>(null);
  const speechStartTimeRef = useRef<number | null>(null);
  const processingRef = useRef(false);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopUtteranceRecorder = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      recorderRef.current = null;
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current,
        });
        chunksRef.current = [];
        recorderRef.current = null;
        resolve(blob.size > 400 ? blob : null);
      };
      recorder.stop();
    });
  }, []);

  const startUtteranceRecorder = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: mimeTypeRef.current,
    });
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(120);
  }, []);

  const finishCapture = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    capturingRef.current = false;
    setIsCapturingSpeech(false);
    silenceStartRef.current = null;
    speechStartTimeRef.current = null;
    speechFrameRef.current = 0;
    callbacksRef.current?.onSpeechEnd?.();

    const blob = await stopUtteranceRecorder();
    processingRef.current = false;

    if (blob && enabledRef.current && callbacksRef.current) {
      callbacksRef.current.onUtterance(blob);
    }
  }, [stopUtteranceRecorder]);

  const vadLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || !enabledRef.current) {
      stopLoop();
      return;
    }

    const rms = computeRms(analyser);
    const smooth = Math.min(1, rms * 14);
    setLevel(smooth);
    callbacksRef.current?.onLevel?.(smooth);

    const now = performance.now();
    const isSpeech = rms > VAD_CONFIG.speechThreshold;

    if (!capturingRef.current) {
      if (isSpeech) {
        speechFrameRef.current += 1;
        if (speechFrameRef.current >= VAD_CONFIG.speechStartFrames) {
          capturingRef.current = true;
          setIsCapturingSpeech(true);
          speechStartTimeRef.current = now;
          silenceStartRef.current = null;
          speechFrameRef.current = 0;
          startUtteranceRecorder();
          callbacksRef.current?.onSpeechStart?.();
        }
      } else {
        speechFrameRef.current = 0;
      }
    } else {
      const speechMs = now - (speechStartTimeRef.current ?? now);

      if (isSpeech) {
        silenceStartRef.current = null;
      } else {
        if (silenceStartRef.current === null) {
          silenceStartRef.current = now;
        } else if (
          now - silenceStartRef.current >= VAD_CONFIG.silenceMs &&
          speechMs >= VAD_CONFIG.minSpeechMs
        ) {
          void finishCapture();
        }
      }

      if (speechMs >= VAD_CONFIG.maxSpeechMs) {
        void finishCapture();
      }
    }

    rafRef.current = requestAnimationFrame(vadLoop);
  }, [finishCapture, startUtteranceRecorder, stopLoop]);

  const start = useCallback(
    async (callbacks: VoiceVadCallbacks) => {
      if (isActive) return;

      callbacksRef.current = callbacks;
      enabledRef.current = true;
      processingRef.current = false;
      capturingRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      mimeTypeRef.current =
        preferred.find((t) => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";

      const ctx = new AudioContext();
      await ctx.resume();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsActive(true);
      rafRef.current = requestAnimationFrame(vadLoop);
    },
    [isActive, vadLoop]
  );

  const stop = useCallback(() => {
    enabledRef.current = false;
    stopLoop();

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;

    capturingRef.current = false;
    processingRef.current = false;
    setIsCapturingSpeech(false);
    setIsActive(false);
    setLevel(0);
    callbacksRef.current = null;
  }, [stopLoop]);

  const cancelCapture = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    capturingRef.current = false;
    processingRef.current = false;
    setIsCapturingSpeech(false);
    silenceStartRef.current = null;
    speechStartTimeRef.current = null;
    speechFrameRef.current = 0;
  }, []);

  const pauseDetection = useCallback(() => {
    enabledRef.current = false;
    cancelCapture();
  }, [cancelCapture]);

  const resumeDetection = useCallback(() => {
    if (!streamRef.current || !analyserRef.current) return;
    enabledRef.current = true;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(vadLoop);
    }
  }, [vadLoop]);

  useEffect(() => () => stop(), [stop]);

  return {
    level,
    isActive,
    isCapturingSpeech,
    analyserRef,
    start,
    stop,
    pauseDetection,
    resumeDetection,
    cancelCapture,
  };
}
