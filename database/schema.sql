-- PAIOS Step 3 — conversations, messages, structured memory
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  model_label TEXT,
  intent TEXT,
  routing_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_conversations_updated
  ON conversations (updated_at DESC);

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('preference', 'long_term', 'project', 'session')),
  category TEXT,
  key TEXT NOT NULL,
  content TEXT NOT NULL,
  importance SMALLINT NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories (type);
CREATE INDEX IF NOT EXISTS idx_memories_conversation ON memories (conversation_id);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories (importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_content_search ON memories (content text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_memories_key_search ON memories (key text_pattern_ops);

CREATE UNIQUE INDEX IF NOT EXISTS memories_global_key_unique
  ON memories (type, key)
  WHERE conversation_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS memories_session_key_unique
  ON memories (conversation_id, type, key)
  WHERE conversation_id IS NOT NULL;

-- Step 6: user preferences (singleton row)
CREATE TABLE IF NOT EXISTS user_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  display_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'id',
  timezone TEXT,
  assistant_style TEXT NOT NULL DEFAULT 'balanced',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO user_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Step 10: server-side memory preferences (singleton JSONB)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS memory_prefs JSONB NOT NULL DEFAULT '{"autoLearnFromChat":true}'::jsonb;

-- Agent power mode: hemat | sedang | max (token vs depth)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS agent_power_mode TEXT NOT NULL DEFAULT 'sedang';

-- Use Agent toggle: force 5-agent team for every message
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS use_agent_team BOOLEAN NOT NULL DEFAULT false;

-- Step 9: semantic memory (embeddings + pin)
ALTER TABLE memories ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding JSONB;

-- Step 11: pgvector ANN search (Neon + pgvector — single DB)
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);

-- Migrate legacy JSONB embeddings into pgvector column
UPDATE memories
SET embedding_vec = (embedding::text)::vector
WHERE embedding IS NOT NULL
  AND embedding_vec IS NULL;

CREATE INDEX IF NOT EXISTS idx_memories_embedding_vec
  ON memories USING hnsw (embedding_vec vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_memories_pinned
  ON memories (pinned DESC, importance DESC, updated_at DESC);
