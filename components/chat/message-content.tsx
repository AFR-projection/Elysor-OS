"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MessageContentProps = {
  content: string;
  className?: string;
};

export function MessageContent({ content, className }: MessageContentProps) {
  if (!content.trim()) return null;

  return (
    <div className={cn("paios-prose text-[15px] leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-cyan-300 underline decoration-cyan-500/40 underline-offset-2 hover:text-cyan-200"
            >
              {children}
            </a>
          ),
          code: ({ className: codeClass, children }) => {
            const isBlock = codeClass?.includes("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-[13px] text-cyan-100 ring-1 ring-white/10">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[13px] text-cyan-200 ring-1 ring-white/10">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-hidden rounded-xl last:mb-0">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-cyan-500/40 pl-4 text-muted-foreground italic last:mb-0">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h3 className="mb-2 text-lg font-semibold text-foreground">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="mb-2 text-base font-semibold text-foreground">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="mb-1.5 text-sm font-semibold text-foreground">{children}</h5>
          ),
          hr: () => <hr className="my-4 border-white/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
