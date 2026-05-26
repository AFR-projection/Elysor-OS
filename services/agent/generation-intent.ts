import type { MessageAttachment } from "@/types/multimodal";
import type { ExportFormat } from "@/lib/documents/types";

function normalizeGenerationText(text: string): string {
  return text
    .trim()
    .replace(/\bvido\b/gi, "video")
    .replace(/\bvidio\b/gi, "video")
    .replace(/\bvedio\b/gi, "video")
    .replace(/\bvidoe\b/gi, "video")
    .replace(/\bvidios\b/gi, "videos")
    .replace(/(\d+)(detik|sec|seconds?)/gi, "$1 $2");
}

const IMAGE_GEN_PATTERNS = [
  /\b(buat|buatkan|bikin|generate|create|design|draw|gambar(?:i|kan)?)\b.*\b(logo|gambar|ilustrasi|icon|avatar|poster|banner|wallpaper|artwork|visual|image|foto)\b/i,
  /\b(logo|gambar|ilustrasi|icon|poster|banner|wallpaper|artwork)\b.*\b(buat|buatkan|bikin|generate|create|design|draw)\b/i,
  /\bgenerate\s+(an?\s+)?(image|logo|picture|illustration|artwork|photo)\b/i,
  /\b(create|design|draw)\s+(an?\s+)?(image|logo|illustration|artwork)\b/i,
  /\bbuat\s+logo\b/i,
  /\bbuatkan\s+logo\b/i,
];

const IMAGE_EDIT_PATTERNS = [
  /\b(buat|buatkan|bikin|generate|create|ubah|edit|transform|ganti|pindah|taruh|letakkan|jadikan|place|put|move)\b/i,
  /\b(orang|person|subjek|foto|gambar|dia|ini|tersebut|nya)\b.*\b(di|ke|to|at|sedang)\b/i,
  /\b(tolong|please)\b.*\b(buat|buatkan|bikin|ganti|ubah)\b/i,
  /\b(latar|background|scene|lokasi|tempat)\b/i,
  /\bsedang\s+(berada|di|lagi)\b/i,
  /\b(di|ke)\s+(pantai|beach|gunung|kantor|rumah|kota|luar|jalan|studio)\b/i,
];

const IMAGE_GEN_NEGATIVE = [
  /\b(analisa|analyze|describe|jelaskan|identifikasi|what('s| is) in|apa\s+(isi|ada)\s+(di|pada)?\s*(gambar|foto|video))\b/i,
  /\b(extract|ocr|baca)\s+(teks|text)\b/i,
  /\b(siapa|who is)\b.*\b(ini|tersebut|gambar|foto)\b/i,
];

const VIDEO_GEN_PATTERNS = [
  /\b(buat|buatkan|bikin|generate|create|animasi(?:kan)?)\b.*\b(vido|vidio|vedio|video|clip|animasi|animation|film|reels?)\b/i,
  /\b(vido|vidio|vedio|video|clip|animasi)\b.*\b(buat|buatkan|bikin|generate|create)\b/i,
  /\bgenerate\s+(an?\s+)?(vido|vidio|video|clip)\b/i,
  /\b(buatkan|buat|bikin)\s+(vido|vidio|video)\b/i,
  /\b(create|make)\s+(an?\s+)?(vido|vidio|video|clip)\b/i,
  /\b(ingin|mau|want|need|tolong|please|kasih|berikan)\b.*\b(vido|vidio|vedio|video|clip|animasi)\b/i,
  /\b(vido|vidio|vedio|video|clip|animasi)\b.*\b(tentang|about|durasi|detik|seconds?)\b/i,
  /\bvideo\s+(tentang|about)\b/i,
];

const VIDEO_REQUEST_INTENT =
  /\b(ingin|mau|buat|buatkan|bikin|generate|create|tolong|please|need|want|kasih|berikan)\b/i;

const VIDEO_KEYWORDS =
  /\b(vido|vidio|vedio|video|clip|animasi|animation|film|reels?)\b/i;

export function getReferenceImageFromAttachments(
  attachments?: MessageAttachment[]
): string | undefined {
  return attachments?.find((a) => a.kind === "image" && a.dataUrl)?.dataUrl;
}

export function hasReferenceImage(attachments?: MessageAttachment[]): boolean {
  return Boolean(getReferenceImageFromAttachments(attachments));
}

export function detectImageGenerationRequest(
  text: string,
  attachments?: MessageAttachment[]
): boolean {
  const t = normalizeGenerationText(text);
  const referenceImage = getReferenceImageFromAttachments(attachments);

  if (referenceImage) {
    if (!t) return false;
    for (const neg of IMAGE_GEN_NEGATIVE) {
      if (neg.test(t)) return false;
    }
    if (VIDEO_KEYWORDS.test(t)) return false;
    if (IMAGE_EDIT_PATTERNS.some((p) => p.test(t))) return true;
    if (IMAGE_GEN_PATTERNS.some((p) => p.test(t))) return true;
    return false;
  }

  if (!t) return false;
  if (VIDEO_KEYWORDS.test(t)) return false;
  for (const neg of IMAGE_GEN_NEGATIVE) {
    if (neg.test(t)) return false;
  }
  return IMAGE_GEN_PATTERNS.some((p) => p.test(t));
}

export function detectVideoGenerationRequest(
  text: string,
  _attachments?: MessageAttachment[]
): boolean {
  const t = normalizeGenerationText(text);
  if (!t) return false;
  if (VIDEO_GEN_PATTERNS.some((p) => p.test(t))) return true;
  if (VIDEO_KEYWORDS.test(t) && VIDEO_REQUEST_INTENT.test(t)) return true;
  return false;
}

export function planNeedsTool(
  plan: { tools_needed?: string[]; steps?: Array<{ tool?: string | null }> },
  toolName: string
): boolean {
  if (plan.tools_needed?.includes(toolName)) return true;
  return plan.steps?.some((s) => s.tool === toolName) ?? false;
}

const FILE_EXPORT_PATTERNS = [
  /\b(kirim|send|export|unduh|download|simpan|save)\b.*\b(pdf|excel|xlsx|csv|file|dokumen|laporan|spreadsheet)\b/i,
  /\b(buat|buatkan|bikin|generate|create|siapkan)\b.*\b(pdf|excel|xlsx|csv|laporan|dokumen|file|report)\b/i,
  /\b(format|dalam bentuk|as|sebagai)\s+(pdf|excel|xlsx|csv|file|dokumen)\b/i,
  /\b(pdf|excel|xlsx|csv)\b.*\b(lengkap|full|detail|complete|sederhana|testing|test)\b/i,
  /\b(testing|test)\b.*\b(pdf|excel|xlsx|csv|file|dokumen)\b/i,
];

const FILE_EXPORT_RESEARCH_KEYWORDS =
  /\b(prediksi|analisa|analyze|research|researched|cari|search|harga|berita|live|bandingkan|compare|forecast|laporan lengkap|2 bulan|dua bulan)\b/i;

export type FileExportIntent = {
  format: ExportFormat;
  /** Can export immediately without web research first */
  simple: boolean;
};

export function parseExportFormatFromUser(text: string): ExportFormat {
  const t = text.toLowerCase();
  if (/\bxlsx|excel|spreadsheet\b/.test(t)) return "xlsx";
  if (/\bcsv\b/.test(t)) return "csv";
  if (/\bjson\b/.test(t)) return "json";
  if (/\bmarkdown\b/.test(t) || /\b\.md\b/.test(t)) return "markdown";
  if (/\btxt\b/.test(t) || /\btext file\b/.test(t)) return "txt";
  return "pdf";
}

export function requiresResearchBeforeExport(text: string): boolean {
  return FILE_EXPORT_RESEARCH_KEYWORDS.test(normalizeGenerationText(text));
}

export function resolveFileExportIntent(
  text: string,
  plan: { tools_needed?: string[]; steps?: Array<{ tool?: string | null }> }
): FileExportIntent | null {
  if (!detectFileExportRequest(text) && !planNeedsTool(plan, "file_export")) {
    return null;
  }

  return {
    format: parseExportFormatFromUser(text),
    simple: !requiresResearchBeforeExport(text),
  };
}

export function buildSimpleFileExportArgs(text: string, format: ExportFormat) {
  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const isTest = /\b(testing|test|uji coba)\b/i.test(text);

  return {
    format,
    filename: isTest ? `paios-${format}-testing` : `paios-export-${format}`,
    title: isTest ? "Dokumen Testing PAIOS" : "Dokumen PAIOS",
    content: [
      "Dokumen ini dibuat otomatis oleh PAIOS.",
      "",
      `Permintaan pengguna: ${text.trim()}`,
      `Dibuat: ${now}`,
      "",
      isTest
        ? "File ini untuk keperluan testing export. Unduh via tombol Download di chat."
        : "Silakan unduh file melalui tombol Download di chat.",
    ].join("\n"),
    sections: [
      {
        heading: "Status Export",
        body: "Export berhasil. File tersimpan dan siap diunduh.",
      },
    ],
  };
}

export function buildFallbackFileExportArgs(
  userText: string,
  format: ExportFormat,
  assistantDraft?: string
) {
  const body =
    assistantDraft?.trim() ||
    `Laporan/export untuk permintaan: ${userText.trim()}`;

  return {
    format,
    filename: `paios-${format}-report`,
    title: userText.trim().slice(0, 100) || "Laporan PAIOS",
    content: body.slice(0, 12_000),
    sections: [
      {
        heading: "Hasil Analisis",
        body: body.slice(0, 6_000),
      },
    ],
  };
}

export function detectFileExportRequest(text: string): boolean {
  const t = normalizeGenerationText(text);
  if (!t) return false;
  return FILE_EXPORT_PATTERNS.some((pattern) => pattern.test(t));
}

export function resolveMediaGenerationHint(
  text: string,
  attachments: MessageAttachment[] | undefined,
  plan: { tools_needed?: string[]; steps?: Array<{ tool?: string | null }> }
): "image" | "video" | null {
  if (
    detectVideoGenerationRequest(text, attachments) ||
    planNeedsTool(plan, "video_generate")
  ) {
    return "video";
  }
  if (
    detectImageGenerationRequest(text, attachments) ||
    planNeedsTool(plan, "image_generate")
  ) {
    return "image";
  }
  return null;
}

export function parseVideoDurationFromUser(text: string): number | undefined {
  const t = normalizeGenerationText(text);
  const match = t.match(/\b(\d+)\s*(detik|sec|seconds?)\b/i);
  if (!match?.[1]) return undefined;
  const seconds = Number.parseInt(match[1], 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/** Veo minimum is 8s — clamp shorter requests */
export function resolveVideoDuration(text: string): {
  duration: number;
  requested?: number;
} {
  const requested = parseVideoDurationFromUser(text);
  const MIN = 8;
  if (!requested) return { duration: MIN };
  return { duration: Math.max(requested, MIN), requested };
}

export function buildImagePromptFromUser(
  text: string,
  options?: { hasReference?: boolean }
): string {
  const t = normalizeGenerationText(text);
  if (options?.hasReference) {
    return [
      "Transform the uploaded reference photo.",
      "Preserve the same person's face, body shape, skin tone, and identity.",
      "Apply only the scene/background/outfit changes requested.",
      `User request: ${t}`,
    ].join(" ");
  }
  return t;
}

export function buildVideoPromptFromUser(text: string): string {
  const normalized = normalizeGenerationText(text);

  const aboutMatch = normalized.match(
    /\b(?:video|clip|animasi)\s+(?:tentang|about)\s+(.+)/i
  );
  if (aboutMatch?.[1]) {
    return aboutMatch[1].trim();
  }

  const stripped = normalized
    .replace(
      /^(saya\s+)?(ingin|mau|tolong|please|want|need)\s+(an?\s+)?(video|clip|animasi)\s*/i,
      ""
    )
    .replace(
      /^(buat|buatkan|bikin|generate|create|animasi(?:kan)?)\s+(vido|vidio|video|clip|animasi)\s*/i,
      ""
    )
    .trim();
  return stripped || normalized;
}

export function formatGeneratedMediaBlock(
  items: Array<{ url: string; kind: string; prompt?: string; model?: string }>
): string {
  if (items.length === 0) return "";
  const lines = items.map(
    (m, i) => {
      const kindLabel =
        m.kind === "document"
          ? `document/${(m as { format?: string }).format ?? "file"}`
          : m.kind;
      return `${i + 1}. ${kindLabel} — URL: ${m.url}${m.model ? ` (model: ${m.model})` : ""}${m.prompt ? `\n   Prompt: ${m.prompt.slice(0, 200)}` : ""}`;
    }
  );
  return `## MEDIA & FILES ALREADY GENERATED THIS TURN (do NOT say "mohon tunggu" or "saya akan buat" — it's DONE)
${lines.join("\n")}

Respond briefly describing the result. The user sees the image/video/file download in the chat UI.`;
}

export function formatFileExportFailureBlock(error: string): string {
  return `## FILE EXPORT FAILED
Error: ${error}

Tell the user clearly in Indonesian that file export failed and why. Do NOT say you "will" create or "please wait" — it already failed.`;
}

export function formatGenerationFailureBlock(input: {
  kind: "image" | "video" | "file";
  error: string;
}): string {
  if (input.kind === "file") {
    return formatFileExportFailureBlock(input.error);
  }
  return `## ${input.kind.toUpperCase()} GENERATION FAILED
Error: ${input.error}

Tell the user clearly in Indonesian that generation failed and why. Do NOT say you "will" create it — it already failed. Suggest retry or check OpenRouter credits.`;
}
