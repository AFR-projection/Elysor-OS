import { deleteMemory, getMemoryById } from "@/services/memory/repository";
import type { ToolResult } from "@/types/tools";

export async function runMemoryDelete(args: {
  id?: string;
}): Promise<ToolResult> {
  const id = args.id?.trim();
  if (!id) {
    return {
      success: false,
      data: null,
      summary: "Missing id",
      error: "id is required",
    };
  }

  const existing = await getMemoryById(id);
  if (!existing) {
    return {
      success: false,
      data: null,
      summary: "Not found",
      error: `Memory ${id} not found`,
    };
  }

  await deleteMemory(id);

  return {
    success: true,
    data: { id, key: existing.key },
    summary: `Memory deleted: ${existing.key}`,
  };
}
