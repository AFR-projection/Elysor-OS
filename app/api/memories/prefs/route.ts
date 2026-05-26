import { isDatabaseConfigured } from "@/lib/db";
import {
  getServerMemoryPreferences,
  updateServerMemoryPreferences,
  type ServerMemoryPreferences,
} from "@/services/memory/prefs";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const prefs = await getServerMemoryPreferences();
    return Response.json({ prefs });
  } catch (error) {
    console.error("[memories/prefs] get:", error);
    return Response.json(
      { error: "Failed to load memory preferences" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<ServerMemoryPreferences>;
    const prefs = await updateServerMemoryPreferences(body);
    return Response.json({ prefs });
  } catch (error) {
    console.error("[memories/prefs] update:", error);
    return Response.json(
      { error: "Failed to save memory preferences" },
      { status: 500 }
    );
  }
}
