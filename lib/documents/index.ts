import { buildPdfBuffer } from "@/lib/documents/pdf-builder";
import { buildCsvBuffer, buildXlsxBuffer } from "@/lib/documents/spreadsheet-builder";
import type { DocumentBuildInput, ExportFormat } from "@/lib/documents/types";
import { EXPORT_EXT, EXPORT_MIME } from "@/lib/documents/types";

export type { DocumentBuildInput, DocumentSection, DocumentTable, DocumentSheet, ExportFormat } from "@/lib/documents/types";
export { EXPORT_EXT, EXPORT_MIME };

function buildPlainText(input: DocumentBuildInput): string {
  const parts: string[] = [];

  if (input.title) parts.push(`# ${input.title}`, "");

  if (input.content?.trim()) parts.push(input.content.trim(), "");

  for (const section of input.sections ?? []) {
    if (section.heading?.trim()) parts.push(`## ${section.heading.trim()}`);
    parts.push(section.body, "");
  }

  for (const table of input.tables ?? []) {
    if (table.title) parts.push(`### ${table.title}`);
    parts.push(table.headers.join(" | "));
    parts.push(table.headers.map(() => "---").join(" | "));
    for (const row of table.rows) {
      parts.push(row.join(" | "));
    }
    parts.push("");
  }

  return parts.join("\n").trim();
}

export async function buildDocumentBuffer(
  input: DocumentBuildInput
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  switch (input.format) {
    case "pdf":
      return {
        buffer: await buildPdfBuffer(input),
        mimeType: EXPORT_MIME.pdf,
        extension: EXPORT_EXT.pdf,
      };
    case "xlsx":
      return {
        buffer: await buildXlsxBuffer(input),
        mimeType: EXPORT_MIME.xlsx,
        extension: EXPORT_EXT.xlsx,
      };
    case "csv":
      return {
        buffer: buildCsvBuffer(input),
        mimeType: EXPORT_MIME.csv,
        extension: EXPORT_EXT.csv,
      };
    case "json": {
      const payload = {
        title: input.title,
        content: input.content,
        sections: input.sections,
        tables: input.tables,
        sheets: input.sheets,
        generatedAt: new Date().toISOString(),
      };
      return {
        buffer: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
        mimeType: EXPORT_MIME.json,
        extension: EXPORT_EXT.json,
      };
    }
    case "markdown":
      return {
        buffer: Buffer.from(buildPlainText(input), "utf-8"),
        mimeType: EXPORT_MIME.markdown,
        extension: EXPORT_EXT.markdown,
      };
    case "txt":
      return {
        buffer: Buffer.from(buildPlainText(input).replace(/^#+\s/gm, ""), "utf-8"),
        mimeType: EXPORT_MIME.txt,
        extension: EXPORT_EXT.txt,
      };
    default:
      throw new Error(`Unsupported format: ${input.format satisfies never}`);
  }
}

export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "paios-export";
}

export function parseExportFormat(value: unknown): ExportFormat | null {
  const formats: ExportFormat[] = ["pdf", "xlsx", "csv", "json", "markdown", "txt"];
  return typeof value === "string" && formats.includes(value as ExportFormat)
    ? (value as ExportFormat)
    : null;
}
