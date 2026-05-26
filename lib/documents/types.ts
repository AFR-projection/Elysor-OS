export type ExportFormat =
  | "pdf"
  | "xlsx"
  | "csv"
  | "json"
  | "markdown"
  | "txt";

export type DocumentSection = {
  heading?: string;
  body: string;
};

export type DocumentTable = {
  title?: string;
  headers: string[];
  rows: string[][];
};

export type DocumentSheet = {
  name: string;
  headers: string[];
  rows: string[][];
};

export type DocumentBuildInput = {
  format: ExportFormat;
  title?: string;
  content?: string;
  sections?: DocumentSection[];
  tables?: DocumentTable[];
  sheets?: DocumentSheet[];
};

export const EXPORT_MIME: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  markdown: "text/markdown; charset=utf-8",
  txt: "text/plain; charset=utf-8",
};

export const EXPORT_EXT: Record<ExportFormat, string> = {
  pdf: "pdf",
  xlsx: "xlsx",
  csv: "csv",
  json: "json",
  markdown: "md",
  txt: "txt",
};
