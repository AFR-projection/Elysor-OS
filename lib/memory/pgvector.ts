import { sql } from "@/lib/db";
import { EMBEDDING_DIMENSION } from "@/lib/memory/config";

export function formatPgVector(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

export function isValidEmbeddingVector(vector: number[] | null): vector is number[] {
  return Boolean(vector?.length === EMBEDDING_DIMENSION);
}

let pgVectorEnabled: boolean | null = null;

/** Cached check: pgvector extension + embedding_vec column available. */
export async function isPgVectorEnabled(): Promise<boolean> {
  if (pgVectorEnabled !== null) return pgVectorEnabled;

  try {
    const ext = await sql`
      SELECT 1 FROM pg_extension WHERE extname = 'vector' LIMIT 1
    `;
    if (!ext.length) {
      pgVectorEnabled = false;
      return false;
    }

    await sql`SELECT embedding_vec FROM memories LIMIT 0`;
    pgVectorEnabled = true;
    return true;
  } catch {
    pgVectorEnabled = false;
    return false;
  }
}

export function resetPgVectorCache(): void {
  pgVectorEnabled = null;
}
