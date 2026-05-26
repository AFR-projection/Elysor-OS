import { isDatabaseConfigured } from "@/lib/db";
import {
  deleteMemory,
  getMemoryById,
  updateMemory,
} from "@/services/memory";
import type { MemoryType, MemoryUpdateInput } from "@/types/memory";

export const runtime = "nodejs";

const VALID_TYPES: MemoryType[] = [
  "preference",
  "long_term",
  "project",
  "session",
];

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as MemoryUpdateInput;
    const patch: MemoryUpdateInput = {};

    if (body.type && VALID_TYPES.includes(body.type)) patch.type = body.type;
    if (body.key !== undefined) {
      patch.key = String(body.key).trim().replace(/\s+/g, "_").slice(0, 80);
    }
    if (body.content !== undefined) {
      patch.content = String(body.content).trim().slice(0, 500);
    }
    if (body.importance !== undefined) patch.importance = body.importance;
    if (body.category !== undefined) patch.category = body.category;
    if (body.pinned !== undefined) patch.pinned = body.pinned;

    const memory = await updateMemory(id, patch);
    if (!memory) {
      return Response.json({ error: "Memory not found" }, { status: 404 });
    }

    return Response.json({ memory });
  } catch (error) {
    console.error("[memories] update:", error);
    return Response.json(
      { error: "Failed to update memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  try {
    const existing = await getMemoryById(id);
    if (!existing) {
      return Response.json({ error: "Memory not found" }, { status: 404 });
    }

    await deleteMemory(id);
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("[memories] delete:", error);
    return Response.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    );
  }
}
