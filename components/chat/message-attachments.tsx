"use client";

import { ImageIcon, Film, FileText } from "lucide-react";
import type { MessageAttachmentMeta } from "@/types/multimodal";

type MessageAttachmentsProps = {
  attachments?: MessageAttachmentMeta[];
};

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (!attachments?.length) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map((file) => (
        <span
          key={file.id}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1 text-[11px] text-muted-foreground ring-1 ring-white/8"
        >
          {file.kind === "image" ? (
            <ImageIcon className="size-3 text-cyan-300" />
          ) : file.kind === "video" ? (
            <Film className="size-3 text-violet-300" />
          ) : (
            <FileText className="size-3 text-amber-300" />
          )}
          {file.name}
        </span>
      ))}
    </div>
  );
}
