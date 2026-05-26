import type { LocalChatMessage } from "@/types/chat";

export function exportChatAsMarkdown(
  messages: LocalChatMessage[],
  title = "PAIOS Chat"
): string {
  const lines = [`# ${title}`, "", `Exported: ${new Date().toLocaleString()}`, ""];

  for (const msg of messages) {
    const role = msg.role === "user" ? "You" : "PAIOS";
    lines.push(`## ${role}`, "", msg.content, "");
    if (msg.meta?.structured?.ui.blocks.length) {
      lines.push(
        `_UI: ${msg.meta.structured.ui.type} · ${msg.meta.structured.ui.blocks.length} blocks_`,
        ""
      );
    }
  }

  return lines.join("\n");
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
