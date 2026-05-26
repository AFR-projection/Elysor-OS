/**
 * Smoke test: file export intent + PDF generation (run before claiming done).
 * Usage: npx tsx scripts/test-file-export.ts
 */
import {
  buildSimpleFileExportArgs,
  detectFileExportRequest,
  resolveFileExportIntent,
} from "../services/agent/generation-intent";
import { runFileExport } from "../services/agent/tools/handlers/file-export";

const USER_MSG = "buatkan pdf sederhana buat testing";

async function main() {
  console.log("1. detectFileExportRequest:", detectFileExportRequest(USER_MSG));
  const intent = resolveFileExportIntent(USER_MSG, {});
  console.log("2. resolveFileExportIntent:", intent);

  if (!intent) {
    console.error("FAIL: intent not detected");
    process.exit(1);
  }

  const args = buildSimpleFileExportArgs(USER_MSG, intent.format);
  console.log("3. export args format:", args.format, "filename:", args.filename);

  const result = await runFileExport(args, { conversationId: "test-conv" });
  console.log("4. runFileExport success:", result.success);
  console.log("5. summary:", result.summary);

  if (!result.success || !result.media) {
    console.error("FAIL: export did not produce media", result.error);
    process.exit(1);
  }

  console.log("6. download URL:", result.media.url);
  console.log("7. kind:", result.media.kind, "format:", result.media.format);
  console.log("PASS: PDF file export works");
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
