"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type VoiceParticlesBackgroundProps = {
  active: boolean;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
};

export function VoiceParticlesBackground({
  active,
  className,
}: VoiceParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;
    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      particles.length = 0;
      const count = Math.min(48, Math.floor((w * h) / 18000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: 1 + Math.random() * 2.2,
          alpha: 0.08 + Math.random() * 0.22,
          hue: Math.random() > 0.5 ? 195 : 285,
        });
      }
    };

    resize();
    seed();
    window.addEventListener("resize", () => {
      resize();
      seed();
    });

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const speed = active ? 1.6 : 0.55;

      for (const p of particles) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `oklch(0.72 0.14 ${p.hue} / ${active ? p.alpha * 1.4 : p.alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 h-full w-full opacity-80", className)}
      aria-hidden
    />
  );
}
