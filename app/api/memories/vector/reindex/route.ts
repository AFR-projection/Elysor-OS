import { isDatabaseConfigured } from "@/lib/db";
import { backfillEmbeddings } from "@/services/memory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      batchSize?: number;
    };

    const updated = await backfillEmbeddings(body.batchSize ?? 50);

    return Response.json({
      result: {
        updated,
        done: updated === 0,
      },
    });
  } catch (error) {
    console.error("[memories/vector/reindex]:", error);
    return Response.json(
      { error: "Failed to backfill embeddings" },
      { status: 500 }
    );
  }
}
