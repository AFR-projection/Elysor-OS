import ExcelJS from "exceljs";
import type { DocumentBuildInput, DocumentSheet } from "@/lib/documents/types";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function normalizeSheet(input: {
  name?: string;
  headers?: string[];
  rows?: string[][];
}): DocumentSheet {
  return {
    name: (input.name ?? "Sheet1").slice(0, 31),
    headers: (input.headers ?? []).map(String),
    rows: (input.rows ?? []).map((row) => row.map(String)),
  };
}

export async function buildXlsxBuffer(input: DocumentBuildInput): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PAIOS";
  workbook.created = new Date();

  const sheets =
    input.sheets && input.sheets.length > 0
      ? input.sheets.map(normalizeSheet)
      : input.tables && input.tables.length > 0
        ? input.tables.map((table, i) =>
            normalizeSheet({
              name: table.title ?? `Sheet${i + 1}`,
              headers: table.headers,
              rows: table.rows,
            })
          )
        : [
            normalizeSheet({
              name: input.title ?? "Data",
              headers: ["Content"],
              rows: [[input.content ?? ""]],
            }),
          ];

  for (const sheetInput of sheets) {
    const sheet = workbook.addWorksheet(sheetInput.name);
    if (sheetInput.headers.length > 0) {
      sheet.addRow(sheetInput.headers);
      sheet.getRow(1).font = { bold: true };
    }
    for (const row of sheetInput.rows) {
      sheet.addRow(row);
    }
    sheet.columns.forEach((column) => {
      column.width = 18;
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function buildCsvBuffer(input: DocumentBuildInput): Buffer {
  const table = input.tables?.[0];
  const headers = table?.headers ?? input.sheets?.[0]?.headers ?? ["Content"];
  const rows =
    table?.rows ??
    input.sheets?.[0]?.rows ??
    [[input.content ?? ""]];

  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      headers
        .map((_, i) => escapeCsvCell(String(row[i] ?? "")))
        .join(",")
    ),
  ];

  return Buffer.from(`\uFEFF${lines.join("\n")}`, "utf-8");
}
