import type { OpenAIFunctionToolDefinition } from "@/types/tools";

export const FUNCTION_TOOL_DEFINITIONS: OpenAIFunctionToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_datetime",
      description:
        "Get the authoritative current date and time for the user timezone. Use when verifying 'now' or scheduling context.",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description:
              "IANA timezone e.g. Asia/Jakarta. Defaults to user timezone.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_search",
      description:
        "Semantic + keyword search over PAIOS memory (preferences, projects, facts). Use before assuming personal details.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "What to search for in memory",
          },
          limit: {
            type: "number",
            description: "Max results (default 8)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_create",
      description:
        "Save a new durable memory about the user (preference, fact, project). Use when user explicitly asks to remember something or shares important lasting info.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["preference", "long_term", "project", "session"],
            description: "Memory category",
          },
          key: {
            type: "string",
            description: "Unique snake_case identifier e.g. preferred_language",
          },
          content: {
            type: "string",
            description: "Clear factual statement to store",
          },
          importance: {
            type: "number",
            description: "1-10, default 5",
          },
          category: {
            type: "string",
            description: "Optional grouping label",
          },
          pinned: {
            type: "boolean",
            description: "Pin as high-priority memory",
          },
        },
        required: ["type", "key", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_update",
      description:
        "Update an existing memory by id (from memory_search results). Use when user corrects a stored fact.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Memory UUID" },
          type: {
            type: "string",
            enum: ["preference", "long_term", "project", "session"],
          },
          key: { type: "string" },
          content: { type: "string" },
          importance: { type: "number" },
          category: { type: "string" },
          pinned: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_delete",
      description:
        "Delete a memory by id when user asks to forget something or info is obsolete.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Memory UUID to delete" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "database_stats",
      description:
        "Get PAIOS system stats: conversation count, message count, memory count from the database.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "workspace_list",
      description:
        "List files and folders in the user's PAIOS workspace directory (workspace/). Use to explore uploaded project files.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative path inside workspace, default '.'",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "workspace_read",
      description:
        "Read a text-based file from the PAIOS workspace folder. For images/video/PDF, user should attach them in chat.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative file path inside workspace/",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "image_generate",
      description:
        "Generate or edit an AI image. Use for new images (logo, illustration) OR transforming an uploaded photo while preserving the subject's face/body (img2img). Pass reference_image_url from the user's attachment when editing.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description:
              "Detailed visual prompt — subject, style, lighting, colors, composition",
          },
          aspect_ratio: {
            type: "string",
            enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
            description: "Output aspect ratio (default 1:1)",
          },
          reference_image_url: {
            type: "string",
            description:
              "Reference photo data URL from user upload — required for img2img edits (change scene/background while keeping same person)",
          },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "video_generate",
      description:
        "Generate an AI video clip from a text prompt using Google Veo. Use when user asks to create/generate/animate a video. Takes 1-5 minutes. Returns a saved MP4 URL.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description:
              "Detailed motion/scene prompt — action, camera, mood, setting",
          },
          duration: {
            type: "number",
            description: "Duration in seconds (default 8, max ~15 depending on model)",
          },
          resolution: {
            type: "string",
            enum: ["720p", "1080p"],
            description: "Video resolution (default 720p)",
          },
          aspect_ratio: {
            type: "string",
            enum: ["16:9", "9:16", "1:1"],
            description: "Aspect ratio (default 16:9)",
          },
          generate_audio: {
            type: "boolean",
            description: "Generate audio track (default true)",
          },
          reference_image_url: {
            type: "string",
            description: "Optional first-frame image URL for image-to-video",
          },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "file_export",
      description:
        "Create and save a downloadable file (PDF, Excel, CSV, JSON, Markdown, TXT) from structured content. Use AFTER gathering data (web_search, analysis). Mandatory when user asks to kirim/export/download/buat laporan in PDF/Excel/CSV or any file format. Returns a download URL shown in chat.",
      parameters: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["pdf", "xlsx", "csv", "json", "markdown", "txt"],
            description: "Output file format",
          },
          filename: {
            type: "string",
            description: "Base filename without extension e.g. prediksi-emas-2026",
          },
          title: {
            type: "string",
            description: "Document title shown at top",
          },
          content: {
            type: "string",
            description: "Main body text (analysis, narrative, conclusions)",
          },
          sections: {
            type: "array",
            description: "Structured sections with optional heading + body",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                body: { type: "string" },
              },
              required: ["body"],
            },
          },
          tables: {
            type: "array",
            description: "Tables for PDF/Excel/CSV — price forecasts, buy/sell signals, data",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                headers: {
                  type: "array",
                  items: { type: "string" },
                },
                rows: {
                  type: "array",
                  items: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
              required: ["headers", "rows"],
            },
          },
          sheets: {
            type: "array",
            description: "Multi-sheet Excel workbook",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                headers: {
                  type: "array",
                  items: { type: "string" },
                },
                rows: {
                  type: "array",
                  items: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
              required: ["name", "headers", "rows"],
            },
          },
        },
        required: ["format", "filename"],
      },
    },
  },
];
