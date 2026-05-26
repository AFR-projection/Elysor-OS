"use client";

import { FileText, Film, ImageIcon, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageAttachment } from "@/types/multimodal";

function KindIcon({ kind }: { kind: MessageAttachment["kind"] }) {
  if (kind === "image") return <ImageIcon className="size-3.5" />;
  if (kind === "video") return <Film className="size-3.5" />;
  return <FileText className="size-3.5" />;
}

type AttachmentPreviewProps = {
  attachments: MessageAttachment[];
  onRemove?: (id: string) => void;
  compact?: boolean;
  className?: string;
};

export function AttachmentPreview({
  attachments,
  onRemove,
  compact,
  className,
}: AttachmentPreviewProps) {
  if (!attachments.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {attachments.map((file) => (
        <div
          key={file.id}
          className={cn(
            "group relative overflow-hidden rounded-xl ring-1 ring-white/10",
            compact ? "max-w-[140px]" : "max-w-[180px]"
          )}
        >
          {file.kind === "image" && file.dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.dataUrl}
              alt={file.name}
              className={cn(
                "object-cover",
                compact ? "h-20 w-full" : "h-24 w-full"
              )}
            />
          ) : (
            <div
              className={cn(
                "flex items-center gap-2 bg-white/[0.04] px-3 text-xs text-muted-foreground",
                compact ? "h-20" : "h-24"
              )}
            >
              <KindIcon kind={file.kind} />
              <span className="line-clamp-2 font-medium">{file.name}</span>
            </div>
          )}
          {onRemove ? (
            <button
              type="button"
              aria-label={`Hapus ${file.name}`}
              onClick={() => onRemove(file.id)}
              className="absolute top-1 right-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type AttachmentPickerProps = {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
};

export function AttachmentPicker({ onFiles, disabled }: AttachmentPickerProps) {
  return (
    <label
      className={cn(
        "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-cyan-300",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      <Paperclip className="size-4" />
      <input
        type="file"
        multiple
        accept="image/*,video/*,application/pdf,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.yaml,.yml"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}
