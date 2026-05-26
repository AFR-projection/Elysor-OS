"use client";

import { useEffect, useRef } from "react";
import type { VoiceSessionPhase } from "@/types/voice";
import { cn } from "@/lib/utils";

type VoiceOrbCanvasProps = {
  phase: VoiceSessionPhase;
  sessionActive: boolean;
  micAnalyserRef?: React.RefObject<AnalyserNode | null>;
  playbackAnalyserRef?: React.RefObject<AnalyserNode | null>;
  level?: number;
  className?: string;
};

function readLevel(analyser: AnalyserNode | null, fallback = 0): number {
  if (!analyser) return fallback;
  const freq = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freq);
  let sum = 0;
  const slice = Math.max(8, Math.floor(freq.length * 0.35));
  for (let i = 0; i < slice; i++) sum += freq[i]!;
  return sum / slice / 255;
}

function phaseColors(phase: VoiceSessionPhase) {
  switch (phase) {
    case "speaking":
      return {
        core: [34, 211, 238] as const,
        accent: [167, 139, 250] as const,
        glow: [139, 92, 246] as const,
      };
    case "user_speaking":
    case "listening":
      return {
        core: [56, 189, 248] as const,
        accent: [45, 212, 191] as const,
        glow: [34, 211, 238] as const,
      };
    case "thinking":
      return {
        core: [251, 191, 36] as const,
        accent: [167, 139, 250] as const,
        glow: [234, 179, 8] as const,
      };
    case "voice_off":
      return {
        core: [148, 163, 184] as const,
        accent: [100, 116, 139] as const,
        glow: [251, 191, 36] as const,
      };
    default:
      return {
        core: [34, 211, 238] as const,
        accent: [167, 139, 250] as const,
        glow: [99, 102, 241] as const,
      };
  }
}

export function VoiceOrbCanvas({
  phase,
  sessionActive,
  micAnalyserRef,
  playbackAnalyserRef,
  level = 0,
  className,
}: VoiceOrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;

    const resize = () => {
      const size = Math.min(canvas.clientWidth, canvas.clientHeight);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const freqBufRef = { current: new Uint8Array(128) };

    const draw = () => {
      const size = Math.min(canvas.clientWidth, canvas.clientHeight);
      const cx = size / 2;
      const cy = size / 2;
      const t = performance.now() / 1000;

      ctx.clearRect(0, 0, size, size);

      const mic = micAnalyserRef?.current ?? null;
      const playback = playbackAnalyserRef?.current ?? null;

      let audio =
        phase === "speaking"
          ? Math.max(readLevel(playback, levelRef.current), levelRef.current * 0.6)
          : phase === "user_speaking" || phase === "listening"
            ? Math.max(readLevel(mic, levelRef.current), levelRef.current)
            : levelRef.current * 0.5;

      if (phase === "thinking") {
        audio = 0.06 + Math.sin(t * 2.4) * 0.04;
      }

      if (!sessionActive) {
        audio = 0.02 + Math.sin(t * 0.9) * 0.015;
      }

      const breathe = sessionActive
        ? 0.028 + Math.sin(t * 1.15) * 0.022
        : 0.018 + Math.sin(t * 0.75) * 0.014;

      const baseR = size * 0.19;
      const pulseR = baseR * (1 + breathe + audio * 0.28);
      const colors = phaseColors(phase);

      // Outer ambient halos
      for (let i = 4; i >= 0; i--) {
        const haloR = pulseR * (2.2 + i * 0.45 + audio * 0.35);
        const g = ctx.createRadialGradient(cx, cy, pulseR * 0.2, cx, cy, haloR);
        const alpha = (0.14 - i * 0.022) * (sessionActive ? 1 : 0.55);
        g.addColorStop(0, `rgba(${colors.glow[0]},${colors.glow[1]},${colors.glow[2]},${alpha})`);
        g.addColorStop(0.45, `rgba(${colors.accent[0]},${colors.accent[1]},${colors.accent[2]},${alpha * 0.35})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
      }

      // Reactive blob outline
      const points = 120;
      const activeAnalyser =
        phase === "speaking" ? playback : mic;

      if (activeAnalyser) {
        if (freqBufRef.current.length !== activeAnalyser.frequencyBinCount) {
          freqBufRef.current = new Uint8Array(activeAnalyser.frequencyBinCount);
        }
        activeAnalyser.getByteFrequencyData(freqBufRef.current);
      }

      const freqBuf = freqBufRef.current;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const idx = Math.floor((i / points) * (freqBuf.length * 0.55));
        const wave = activeAnalyser ? (freqBuf[idx]! / 255) * size * 0.055 : 0;
        const wobble =
          Math.sin(angle * 3 + t * 1.8) * size * 0.008 +
          Math.cos(angle * 5 - t * 1.2) * size * 0.005;
        const r = pulseR + wave + wobble + (sessionActive ? 0 : size * 0.006);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const bodyGrad = ctx.createRadialGradient(
        cx - pulseR * 0.25,
        cy - pulseR * 0.35,
        pulseR * 0.05,
        cx,
        cy,
        pulseR * 1.15
      );
      bodyGrad.addColorStop(
        0,
        `rgba(255,255,255,${0.55 + audio * 0.25})`
      );
      bodyGrad.addColorStop(
        0.35,
        `rgba(${colors.core[0]},${colors.core[1]},${colors.core[2]},${0.75 + audio * 0.15})`
      );
      bodyGrad.addColorStop(
        0.72,
        `rgba(${colors.accent[0]},${colors.accent[1]},${colors.accent[2]},${0.45 + audio * 0.2})`
      );
      bodyGrad.addColorStop(1, `rgba(15,23,42,0.85)`);

      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Specular highlight
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const spec = ctx.createRadialGradient(
        cx - pulseR * 0.35,
        cy - pulseR * 0.45,
        0,
        cx - pulseR * 0.1,
        cy - pulseR * 0.15,
        pulseR * 0.85
      );
      spec.addColorStop(0, `rgba(255,255,255,${0.35 + audio * 0.2})`);
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner core glow
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR * 0.55);
      core.addColorStop(0, `rgba(255,255,255,${0.7 + audio * 0.2})`);
      core.addColorStop(0.4, `rgba(${colors.core[0]},${colors.core[1]},${colors.core[2]},0.5)`);
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR * 0.62, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [micAnalyserRef, playbackAnalyserRef, phase, sessionActive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "aspect-square h-[min(72vw,340px)] w-[min(72vw,340px)] max-w-full shrink-0",
        className
      )}
      aria-hidden
    />
  );
}
