import { randomUUID } from "node:crypto";
import {
  buildDocumentBuffer,
  parseExportFormat,
  sanitizeFilename,
  type DocumentSection,
  type DocumentSheet,
  type DocumentTable,
} from "@/lib/documents";
import { saveGeneratedFile } from "@/lib/media/storage";
import type { GeneratedMediaItem } from "@/types/media";
import type { ToolExecutionContext, ToolResult } from "@/types/tools";

function parseSections(raw: unknown): DocumentSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      heading: typeof item.heading === "string" ? item.heading : undefined,
      body: String(item.body ?? ""),
    }))
    .filter((item) => item.body.trim().length > 0);
}

function parseTable(raw: unknown): DocumentTable | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const headers = Array.isArray(obj.headers)
    ? obj.headers.map(String)
    : [];
  const rows = Array.isArray(obj.rows)
    ? obj.rows
        .filter(Array.isArray)
        .map((row) => (row as unknown[]).map(String))
    : [];
  if (headers.length === 0 && rows.length === 0) return null;
  return {
    title: typeof obj.title === "string" ? obj.title : undefined,
    headers,
    rows,
  };
}

function parseTables(raw: unknown): DocumentTable[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseTable).filter(Boolean) as DocumentTable[];
}

function parseSheets(raw: unknown): DocumentSheet[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const headers = Array.isArray(obj.headers)
        ? obj.headers.map(String)
        : [];
      const rows = Array.isArray(obj.rows)
        ? obj.rows
            .filter(Array.isArray)
            .map((row) => (row as unknown[]).map(String))
        : [];
      if (headers.length === 0 && rows.length === 0) return null;
      return {
        name: String(obj.name ?? "Sheet1").slice(0, 31),
        headers,
        rows,
      };
    })
    .filter(Boolean) as DocumentSheet[];
}

function hasContent(input: {
  content?: string;
  sections: DocumentSection[];
  tables: DocumentTable[];
  sheets: DocumentSheet[];
}): boolean {
  return (
    Boolean(input.content?.trim()) ||
    input.sections.length > 0 ||
    input.tables.length > 0 ||
    input.sheets.length > 0
  );
}

export async function runFileExport(
  args: {
    format?: string;
    filename?: string;
    title?: string;
    content?: string;
    sections?: unknown;
    tables?: unknown;
    sheets?: unknown;
  },
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const format = parseExportFormat(args.format);
  if (!format) {
    return {
      success: false,
      data: null,
      summary: "Format tidak valid — gunakan pdf, xlsx, csv, json, markdown, atau txt",
      error: "Invalid format",
    };
  }

  const sections = parseSections(args.sections);
  const tables = parseTables(args.tables);
  const sheets = parseSheets(args.sheets);
  const content = typeof args.content === "string" ? args.content : undefined;
  const title = typeof args.title === "string" ? args.title.trim() : undefined;

  if (!hasContent({ content, sections, tables, sheets })) {
    return {
      success: false,
      data: null,
      summary: "Konten kosong — isi content, sections, tables, atau sheets",
      error: "Empty content",
    };
  }

  try {
    const { buffer, mimeType } = await buildDocumentBuffer({
      format,
      title,
      content,
      sections,
      tables,
      sheets,
    });

    const baseName = sanitizeFilename(args.filename ?? title ?? "paios-export");
    const saved = await saveGeneratedFile({
      buffer,
      mimeType,
      prefix: "document",
      filenameHint: baseName,
    });

    const media: GeneratedMediaItem = {
      id: randomUUID(),
      kind: "document",
      url: saved.url,
      name: saved.filename,
      mimeType,
      size: saved.size,
      format,
      title,
      conversationId: ctx.conversationId,
    };

    return {
      success: true,
      data: { ...media, relativePath: saved.relativePath, downloadUrl: saved.url },
      summary: `File ${format.toUpperCase()} dibuat · ${saved.filename}`,
      media,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "File export failed";
    return {
      success: false,
      data: null,
      summary: message,
      error: message,
    };
  }
}
