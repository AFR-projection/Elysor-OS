import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local and run again.");
  process.exit(1);
}

const sql = neon(url);
const schemaPath = join(__dirname, "../database/schema.sql");
const raw = readFileSync(schemaPath, "utf8");

/** Strip line comments so CREATE statements after header comments are not dropped */
function stripLineComments(source) {
  return source
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function parseStatements(source) {
  return stripLineComments(source)
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const statements = parseStatements(raw);

if (statements.length === 0) {
  console.error("No SQL statements found in", schemaPath);
  process.exit(1);
}

console.log(`Running ${statements.length} migration statements...\n`);

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  const preview = statement.slice(0, 70).replace(/\s+/g, " ");

  try {
    await sql.query(statement);
    console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
  } catch (error) {
    console.error(`\n✗ Failed on statement ${i + 1}:`);
    console.error(preview);
    console.error(error);
    process.exit(1);
  }
}

console.log("\nPAIOS database schema applied successfully.");
