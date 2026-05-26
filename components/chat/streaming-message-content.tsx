"use client";

import { MessageContent } from "@/components/chat/message-content";
import { StreamingCursor } from "@/components/chat/streaming-cursor";
import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";

type StreamingMessageContentProps = {
  content: string;
  isStreaming?: boolean;
  className?: string;
};

export function StreamingMessageContent({
  content,
  isStreaming,
  className,
}: StreamingMessageContentProps) {
  const { displayed, isTyping } = useTypewriter(content, {
    active: Boolean(isStreaming),
    charDelay: 12,
    catchUpThreshold: 48,
  });

  const visible = isStreaming ? displayed : content;

  if (!visible.trim() && !isStreaming) return null;

  return (
    <div
      className={cn(
        "relative",
        isStreaming && isTyping && "paios-stream-text-glow",
        className
      )}
    >
      {visible.trim() ? <MessageContent content={visible} /> : null}
      {isStreaming && (isTyping || !content.trim()) ? (
        <StreamingCursor />
      ) : null}
    </div>
  );
}
