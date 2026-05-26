import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { DocumentBuildInput, DocumentTable } from "@/lib/documents/types";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const BODY_SIZE = 11;
const HEADING_SIZE = 14;
const TITLE_SIZE = 20;
const LINE_HEIGHT = 15;

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  maxWidth: number;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }

  return lines.length > 0 ? lines : [""];
}

function ensureSpace(ctx: PdfContext, needed = LINE_HEIGHT): PDFPage {
  if (ctx.y - needed >= MARGIN) return ctx.page;

  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN;
  return ctx.page;
}

function drawLines(
  ctx: PdfContext,
  lines: string[],
  size: number,
  font: PDFFont,
  color = rgb(0.12, 0.12, 0.14)
): void {
  for (const line of lines) {
    ensureSpace(ctx, LINE_HEIGHT);
    ctx.page.drawText(line, {
      x: MARGIN,
      y: ctx.y,
      size,
      font,
      color,
    });
    ctx.y -= LINE_HEIGHT;
  }
}

function drawTable(ctx: PdfContext, table: DocumentTable): void {
  const headers = table.headers.map(String);
  const rows = table.rows.map((row) => row.map(String));
  const colCount = Math.max(headers.length, ...rows.map((r) => r.length), 1);
  const colWidth = (ctx.maxWidth - 8) / colCount;

  ensureSpace(ctx, LINE_HEIGHT * 2);
  if (table.title) {
    drawLines(ctx, wrapText(table.title, ctx.bold, HEADING_SIZE, ctx.maxWidth), HEADING_SIZE, ctx.bold);
    ctx.y -= 4;
  }

  const drawRow = (cells: string[], bold = false) => {
    const font = bold ? ctx.bold : ctx.font;
    const rowLines = cells.map((cell, i) =>
      wrapText(cell, font, 9, colWidth - 6).slice(0, 4)
    );
    const height = Math.max(...rowLines.map((l) => l.length), 1) * 12 + 8;
    ensureSpace(ctx, height);

    for (let col = 0; col < colCount; col++) {
      const x = MARGIN + col * colWidth;
      ctx.page.drawRectangle({
        x,
        y: ctx.y - height + 8,
        width: colWidth,
        height,
        borderColor: rgb(0.75, 0.75, 0.78),
        borderWidth: 0.5,
      });

      const cellLines = rowLines[col] ?? [""];
      let cellY = ctx.y - 4;
      for (const line of cellLines) {
        ctx.page.drawText(line.slice(0, 80), {
          x: x + 4,
          y: cellY,
          size: 9,
          font,
          color: rgb(0.1, 0.1, 0.12),
        });
        cellY -= 11;
      }
    }

    ctx.y -= height;
  };

  const normalizedHeaders = Array.from({ length: colCount }, (_, i) => headers[i] ?? "");
  drawRow(normalizedHeaders, true);

  for (const row of rows) {
    const normalized = Array.from({ length: colCount }, (_, i) => row[i] ?? "");
    drawRow(normalized);
  }

  ctx.y -= 8;
}

export async function buildPdfBuffer(input: DocumentBuildInput): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const ctx: PdfContext = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
    font,
    bold,
    maxWidth: PAGE_WIDTH - MARGIN * 2,
  };

  if (input.title) {
    drawLines(
      ctx,
      wrapText(input.title, bold, TITLE_SIZE, ctx.maxWidth),
      TITLE_SIZE,
      bold
    );
    ctx.y -= 10;
  }

  if (input.content?.trim()) {
    drawLines(
      ctx,
      wrapText(input.content.trim(), font, BODY_SIZE, ctx.maxWidth),
      BODY_SIZE,
      font
    );
    ctx.y -= 6;
  }

  for (const section of input.sections ?? []) {
    if (section.heading?.trim()) {
      drawLines(
        ctx,
        wrapText(section.heading.trim(), bold, HEADING_SIZE, ctx.maxWidth),
        HEADING_SIZE,
        bold
      );
      ctx.y -= 4;
    }
    drawLines(
      ctx,
      wrapText(section.body, font, BODY_SIZE, ctx.maxWidth),
      BODY_SIZE,
      font
    );
    ctx.y -= 8;
  }

  for (const table of input.tables ?? []) {
    drawTable(ctx, table);
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
