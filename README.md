# PAIOS — Personal AI Operating System

Foundation bootstrap (Step 1). This is **not** a simple chatbot — it is the shell for a full AI operating system.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Neon PostgreSQL (`@neondatabase/serverless`)
- OpenRouter API client (skeleton, server-only)

## Getting started

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in `DATABASE_URL`, `OPENROUTER_API_KEY`, and `APP_URL` in `.env.local`.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/           # Routes and layouts
components/    # UI (layout shell, chat, shadcn)
lib/           # db, openrouter, utils
server/        # Server modules (Step 2+)
services/      # Business logic (Step 2+)
types/         # Shared TypeScript types
prompts/       # Agent prompts (Step 2+)
database/      # Migrations & schema (later)
```

## Step 3 — Memory & persistence (live)

Run migrations once:

```bash
npm run db:migrate
```

- **Neon schema** — `conversations`, `messages`, `memories` (with pg_trgm search)
- **Memory recall** — relevant facts injected before every LLM call
- **Memory extraction** — after each reply, Gemini extracts durable facts automatically
- **Chat history** — sidebar loads real threads from DB; delete supported
- **Memory panel** — sidebar shows stored memory count + preview

Memory types: `preference`, `long_term`, `project`, `session`

## Step 9 — Memory v2 (live)

Run migrate again if upgrading from Step 8:

```bash
npm run db:migrate
```

- **Semantic search** — OpenRouter embeddings (`text-embedding-3-small`) + hybrid recall (vector + keyword)
- **Pinned memories** — high-priority facts always rank higher
- **Agent memory tools** — `memory_create`, `memory_update`, `memory_delete` (+ improved `memory_search`)
- **Interactive memory panel** — search, filter, edit, pin, delete, manual add
- **REST CRUD** — `GET/POST /api/memories`, `PATCH/DELETE /api/memories/[id]`
- **Auto backfill** — existing memories get embeddings on next load

Memory types: `preference`, `long_term`, `project`, `session`

## Step 2 — Agent system (live)

- **Agent orchestrator** — intent → model router → realtime context → LLM stream
- **Multi-model routing** — general / reasoning / coding / research
- **Realtime awareness** — date, time, timezone injected into every request
- **Streaming chat** — `/api/chat` SSE → live tokens in UI
- **Model badge** — shows which model answered and why

Set `OPENROUTER_API_KEY` in `.env.local` before chatting.

## Step 8 — Multimodal + Awareness (live)

- **Image / video / PDF upload** — attach via 📎 in chat (OpenRouter multimodal API)
- **Gemini 2.5 Flash** routing for vision + video perception
- **PDF plugin** — Cloudflare AI parser via OpenRouter
- **Awareness Kernel** — meta-cognitive self-model layer (simulated, not literal AGI)
- **Workspace tools** — `workspace_list` / `workspace_read` for files in `workspace/` folder
- **Text file inline** — `.md`, `.json`, `.ts`, etc. injected as context

> **Note:** PAIOS simulates deep awareness — it is not true AGI/ASI consciousness.

Put project files in `workspace/` for agent file access.

## Step 7 — Agent Planner (live)

Before answering, PAIOS **plans first** using a fast LLM (Gemini Flash):

- **LLM planner** — analyzes request, picks intent, suggests tools, breaks into steps
- **Plan card UI** — visible execution plan with live step progress
- **Plan-aware routing** — planner intent overrides regex when confident
- **System prompt injection** — main agent follows the generated plan
- **Live step tracking** — tools and streaming update plan step status

Flow: `planning → plan card → tools → streaming → rendering`

## Step 6 — Polish (live)

- **User settings** — nama, bahasa, timezone, gaya respons (disimpan Neon)
- **Stop generation** — tombol stop / Esc
- **Regenerate** — ulang jawaban terakhir
- **Copy message** — hover action di setiap balasan
- **Export chat** — download Markdown
- **Search history** — filter sidebar
- **Keyboard shortcuts** — Ctrl+N chat baru, Esc stop
- **Toast notifications**
- **Live streaming UX** — token real-time dari LLM, fase agent (thinking → tools → composing → streaming → rendering), cursor glow, progressive UI block reveal

Jalankan migrate jika belum: `npm run db:migrate` (tambah `user_settings`).

## Step 5 — Dynamic UI (live)

AI returns structured JSON → rendered as rich UI blocks:

| Block | Use case |
|-------|----------|
| `stat` | Metrics dashboard |
| `card` | Comparisons, summaries |
| `timeline` | Steps, history |
| `chart` | Bar charts for numbers |
| `alert` | Callouts |
| `list` | Key-value data |
| `code` | Code snippets |

Plus **action buttons** (link, prompt, copy). Persisted in message metadata.

## Step 4 — Tool system (live)

The agent can **call tools** in a loop, then stream the final answer.

| Tool | Purpose |
|------|---------|
| `get_datetime` | Authoritative date/time (local) |
| `memory_search` | Query stored user memories (local) |
| `web_search` | **OpenRouter server tool** — live web via Exa/native auto |
| `database_stats` | PAIOS DB stats (local) |

Web search uses `openrouter:web_search` — only `OPENROUTER_API_KEY` needed (no Serper/Tavily).

## Vision progress (Steps 1–9)

PAIOS now has: agent orchestrator, planning layer, multi-model routing, memory v2 (semantic), tools, dynamic UI, live streaming, multimodal perception, and awareness kernel.

### Future ideas

- Auth & multi-user
- Multimodal (images, voice)

See `PROJECT_SPEC.md` for the full vision.
