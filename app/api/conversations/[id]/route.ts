import { isDatabaseConfigured } from "@/lib/db";
import {
  deleteConversation,
  getConversation,
} from "@/services/conversations";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  try {
    const conversation = await getConversation(id);
    if (!conversation) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ conversation });
  } catch (error) {
    console.error("[conversations] get:", error);
    return Response.json(
      { error: "Failed to load conversation" },
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
    await deleteConversation(id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[conversations] delete:", error);
    return Response.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
