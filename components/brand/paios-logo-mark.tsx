"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type PaiosLogoMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function PaiosLogoMark({
  size = "lg",
  className,
}: PaiosLogoMarkProps) {
  return (
    <div
      className={cn(
        "paios-logo-mark",
        size === "sm" && "paios-logo-mark--sm",
        size === "md" && "paios-logo-mark--md",
        size === "lg" && "paios-logo-mark--lg",
        className
      )}
      role="img"
      aria-label="PAIOS"
    >
      <div className="paios-logo-mark__ambient" aria-hidden />
      <div className="paios-logo-mark__halo" aria-hidden />

      <div className="paios-logo-mark__frame">
        <div className="paios-logo-mark__ring" aria-hidden />
        <div className="paios-logo-mark__glass">
          <div className="paios-logo-mark__sheen" aria-hidden />
          <Sparkles
            className="paios-logo-mark__spark"
            strokeWidth={1.65}
            aria-hidden
          />
        </div>
      </div>

      <div className="paios-logo-mark__orbit paios-logo-mark__orbit--a" aria-hidden>
        <span className="paios-logo-mark__dot paios-logo-mark__dot--cyan" />
      </div>
      <div className="paios-logo-mark__orbit paios-logo-mark__orbit--b" aria-hidden>
        <span className="paios-logo-mark__dot paios-logo-mark__dot--violet" />
      </div>
      <div className="paios-logo-mark__orbit paios-logo-mark__orbit--c" aria-hidden>
        <span className="paios-logo-mark__dot paios-logo-mark__dot--soft" />
      </div>
    </div>
  );
}
