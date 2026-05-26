import { isDatabaseConfigured } from "@/lib/db";
import {
  createConversation,
  listConversations,
} from "@/services/conversations";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const conversations = await listConversations();
    return Response.json({ conversations });
  } catch (error) {
    console.error("[conversations] list:", error);
    return Response.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}

export async function POST() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const conversation = await createConversation();
    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("[conversations] create:", error);
    return Response.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
