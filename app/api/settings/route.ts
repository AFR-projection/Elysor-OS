import { isDatabaseConfigured } from "@/lib/db";
import { getUserSettings, updateUserSettings } from "@/services/settings/repository";
import type { UpdateUserSettingsInput } from "@/types/settings";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const settings = await getUserSettings();
    return Response.json({ settings });
  } catch (error) {
    console.error("[settings] get:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load settings";
    return Response.json({ error: message }, { status: 500 });
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
    const body = (await request.json()) as UpdateUserSettingsInput;
    const settings = await updateUserSettings(body);
    return Response.json({ settings });
  } catch (error) {
    console.error("[settings] update:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save settings";
    return Response.json({ error: message }, { status: 500 });
  }
}
