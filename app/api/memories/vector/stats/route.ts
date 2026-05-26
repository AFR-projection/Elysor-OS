import { isDatabaseConfigured } from "@/lib/db";
import { isPgVectorEnabled } from "@/lib/memory/pgvector";
import {
  countMemories,
  countMemoriesWithoutEmbedding,
} from "@/services/memory";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const [total, withoutEmbedding, pgvectorEnabled] = await Promise.all([
      countMemories(),
      countMemoriesWithoutEmbedding(),
      isPgVectorEnabled(),
    ]);

    return Response.json({
      postgres: {
        total,
        withEmbedding: total - withoutEmbedding,
        withoutEmbedding,
      },
      pgvector: { enabled: pgvectorEnabled },
      recall: pgvectorEnabled ? "pgvector" : "keyword",
    });
  } catch (error) {
    console.error("[memories/vector/stats]:", error);
    return Response.json(
      { error: "Failed to load vector stats" },
      { status: 500 }
    );
  }
}
