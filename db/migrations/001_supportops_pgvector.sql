CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS support_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_chunks (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES support_articles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  start_char INTEGER NOT NULL,
  end_char INTEGER NOT NULL,
  embedding VECTOR(__EMBEDDING_DIM__),
  metadata_title TEXT NOT NULL,
  metadata_source_url TEXT NOT NULL,
  metadata_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_traces (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  rewritten_query TEXT NOT NULL,
  retrieval_mode TEXT NOT NULL CHECK (retrieval_mode IN ('embedding', 'keyword')),
  retrieval JSONB NOT NULL,
  model TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  token_usage JSONB,
  estimated_cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_escalations (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  reason TEXT NOT NULL CHECK (
    reason IN ('NO_RELEVANT_CONTEXT', 'LOW_CONFIDENCE', 'CONFLICTING_SOURCES', 'LEGAL_OR_FINANCIAL_REQUEST')
  ),
  answer TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS support_articles_created_idx
  ON support_articles(created_at DESC);

CREATE INDEX IF NOT EXISTS support_chunks_article_idx
  ON support_chunks(article_id);

CREATE INDEX IF NOT EXISTS support_chunks_updated_idx
  ON support_chunks(updated_at DESC);

CREATE INDEX IF NOT EXISTS support_traces_created_idx
  ON support_traces(created_at DESC);

CREATE INDEX IF NOT EXISTS support_escalations_resolved_created_idx
  ON support_escalations(resolved, created_at DESC);

CREATE INDEX IF NOT EXISTS support_chunks_embedding_cosine_idx
  ON support_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
