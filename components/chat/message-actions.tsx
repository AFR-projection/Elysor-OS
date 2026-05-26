"use client";

import { Copy, RotateCcw } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type MessageActionsProps = {
  content: string;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
  className?: string;
};

export function MessageActions({
  content,
  canRegenerate,
  onRegenerate,
  className,
}: MessageActionsProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast("Disalin ke clipboard", "success");
    } catch {
      toast("Gagal menyalin", "error");
    }
  };

  return (
    <div
      className={cn(
        "mt-1.5 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100",
        className
      )}
    >
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-white/5 hover:text-foreground sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]"
      >
        <Copy className="size-3" />
        Copy
      </button>
      {canRegenerate && onRegenerate ? (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-white/5 hover:text-foreground sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]"
        >
          <RotateCcw className="size-3" />
          Regenerate
        </button>
      ) : null}
    </div>
  );
}
