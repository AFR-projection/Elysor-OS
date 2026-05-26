"use client";

import { useCallback, useRef, useState } from "react";

type RecorderStopResult = {
  blob: Blob;
  mimeType: string;
};

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const mimeTypeRef = useRef("audio/webm");

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevel(0);
  }, []);

  const startMeter = useCallback((analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i]!;
      const avg = sum / data.length / 255;
      setLevel(avg);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const cleanupStream = useCallback(() => {
    stopMeter();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, [stopMeter]);

  const start = useCallback(async () => {
    if (isRecording) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    streamRef.current = stream;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    startMeter(analyser);

    const preferred = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];
    const mimeType =
      preferred.find((t) => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";
    mimeTypeRef.current = mimeType;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(250);
    setIsRecording(true);
  }, [isRecording, startMeter]);

  const stop = useCallback(async (): Promise<RecorderStopResult | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cleanupStream();
      setIsRecording(false);
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        cleanupStream();
        setIsRecording(false);
        resolve({ blob, mimeType: mimeTypeRef.current });
      };
      recorder.stop();
    });
  }, [cleanupStream]);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    chunksRef.current = [];
    cleanupStream();
    setIsRecording(false);
  }, [cleanupStream]);

  return {
    isRecording,
    level,
    start,
    stop,
    cancel,
  };
}
