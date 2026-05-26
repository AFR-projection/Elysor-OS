import { isDatabaseConfigured } from "@/lib/db";
import {
  backfillEmbeddings,
  countMemories,
  createMemory,
  listMemories,
} from "@/services/memory";
import type { MemoryCreateInput, MemoryType } from "@/types/memory";

export const runtime = "nodejs";

const VALID_TYPES: MemoryType[] = [
  "preference",
  "long_term",
  "project",
  "session",
];

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const query = searchParams.get("q") ?? undefined;
  const type =
    typeParam && VALID_TYPES.includes(typeParam as MemoryType)
      ? (typeParam as MemoryType)
      : undefined;

  try {
    void backfillEmbeddings(10).catch((err) =>
      console.warn("[memories] backfill:", err)
    );

    const [memories, total] = await Promise.all([
      listMemories({ type, query, limit: 100 }),
      countMemories(),
    ]);

    return Response.json({ memories, total });
  } catch (error) {
    console.error("[memories] list:", error);
    return Response.json(
      { error: "Failed to load memories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<MemoryCreateInput>;
    const type =
      body.type && VALID_TYPES.includes(body.type) ? body.type : "long_term";
    const key = String(body.key ?? "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 80);
    const content = String(body.content ?? "").trim().slice(0, 500);

    if (!key || !content) {
      return Response.json(
        { error: "key and content are required" },
        { status: 400 }
      );
    }

    const memory = await createMemory({
      type,
      key,
      content,
      importance: body.importance,
      category: body.category ?? null,
      pinned: body.pinned ?? false,
      conversationId:
        type === "session" ? (body.conversationId ?? null) : null,
    });

    return Response.json({ memory }, { status: 201 });
  } catch (error) {
    console.error("[memories] create:", error);
    return Response.json(
      { error: "Failed to create memory" },
      { status: 500 }
    );
  }
}
