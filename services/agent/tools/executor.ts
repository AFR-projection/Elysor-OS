import { runDatabaseStats } from "@/services/agent/tools/handlers/database-stats";
import { runGetDatetime } from "@/services/agent/tools/handlers/datetime";
import { runMemoryCreate } from "@/services/agent/tools/handlers/memory-create";
import { runMemoryDelete } from "@/services/agent/tools/handlers/memory-delete";
import { runMemorySearch } from "@/services/agent/tools/handlers/memory-search";
import { runMemoryUpdate } from "@/services/agent/tools/handlers/memory-update";
import { runFileExport } from "@/services/agent/tools/handlers/file-export";
import { runImageGenerate } from "@/services/agent/tools/handlers/image-generate";
import { runVideoGenerate } from "@/services/agent/tools/handlers/video-generate";
import {
  workspaceList,
  workspaceRead,
} from "@/services/agent/tools/handlers/workspace";
import type {
  LocalToolName,
  ToolExecutionContext,
  ToolResult,
} from "@/types/tools";

function parseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Execute PAIOS-local tools only — web_search runs on OpenRouter servers */
export async function executeTool(
  name: LocalToolName,
  argsJson: string,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const args = parseArgs(argsJson);

  switch (name) {
    case "get_datetime":
      return runGetDatetime(args as { timezone?: string }, ctx);
    case "memory_search":
      return runMemorySearch(
        args as { query?: string; limit?: number },
        ctx
      );
    case "memory_create":
      return runMemoryCreate(
        args as {
          type?: string;
          key?: string;
          content?: string;
          importance?: number;
          category?: string;
          pinned?: boolean;
        },
        ctx
      );
    case "memory_update":
      return runMemoryUpdate(
        args as {
          id?: string;
          type?: string;
          key?: string;
          content?: string;
          importance?: number;
          category?: string;
          pinned?: boolean;
        }
      );
    case "memory_delete":
      return runMemoryDelete(args as { id?: string });
    case "database_stats":
      return runDatabaseStats();
    case "workspace_list":
      return workspaceList(
        typeof args.path === "string" ? args.path : "."
      );
    case "workspace_read":
      return workspaceRead(
        typeof args.path === "string" ? args.path : ""
      );
    case "image_generate": {
      const imageArgs = args as {
        prompt?: string;
        aspect_ratio?: string;
        reference_image_url?: string;
        model?: string;
      };
      return runImageGenerate(
        {
          ...imageArgs,
          reference_image_url:
            imageArgs.reference_image_url ?? ctx.referenceImageUrl,
        },
        ctx
      );
    }
    case "video_generate":
      return runVideoGenerate(
        args as {
          prompt?: string;
          duration?: number;
          resolution?: string;
          aspect_ratio?: string;
          generate_audio?: boolean;
          reference_image_url?: string;
          model?: string;
        },
        ctx
      );
    case "file_export":
      return runFileExport(
        args as {
          format?: string;
          filename?: string;
          title?: string;
          content?: string;
          sections?: unknown;
          tables?: unknown;
          sheets?: unknown;
        },
        ctx
      );
  }
}

export function toolResultToMessageContent(result: ToolResult): string {
  const payload: Record<string, unknown> = {
    success: result.success,
    summary: result.summary,
    data: result.data,
    error: result.error,
  };

  if (result.media) {
    payload.downloadUrl = result.media.url;
    payload.fileKind = result.media.kind;
    payload.fileFormat = result.media.format;
  }

  return JSON.stringify(payload, null, 2);
}
