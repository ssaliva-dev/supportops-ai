import { Pool } from "pg";

import { RAG_CONFIG } from "@/lib/config";
import type { KnowledgeStore, RunStore } from "@/lib/store/types";
import { makeId } from "@/lib/utils/id";
import type { Article, Chunk, Escalation, Trace } from "@/types/domain";

const DEFAULT_EMBEDDING_DIM = 1536;
const embeddingDimension = normalizeEmbeddingDimension(process.env.PGVECTOR_EMBEDDING_DIM);

let pool: Pool | null = null;

type ArticleRow = {
  id: string;
  title: string;
  body: string;
  tags: string[] | null;
  source_url: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type ChunkRow = {
  id: string;
  article_id: string;
  content: string;
  token_count: number;
  start_char: number;
  end_char: number;
  embedding: string | null;
  metadata_title: string;
  metadata_source_url: string;
  metadata_tags: string[] | null;
};

type TraceRow = {
  id: string;
  question: string;
  rewritten_query: string;
  retrieval_mode: "embedding" | "keyword";
  retrieval: Trace["retrieval"];
  model: string;
  latency_ms: number;
  token_usage: Trace["tokenUsage"] | null;
  estimated_cost_usd: number;
  created_at: Date | string;
};

type EscalationRow = {
  id: string;
  question: string;
  created_at: Date | string;
  confidence: number;
  reason: Escalation["reason"];
  answer: string;
  citations: Escalation["citations"];
  resolved: boolean;
  resolution_notes: string | null;
};

function normalizeEmbeddingDimension(rawDimension: string | undefined): number {
  const parsed = Number(rawDimension);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_EMBEDDING_DIM;
  }
  return Math.floor(parsed);
}

function toIsoString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

function parseVector(raw: string | null): number[] | undefined {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  const values = (trimmed.startsWith("[") && trimmed.endsWith("]") ? trimmed.slice(1, -1) : trimmed)
    .split(",")
    .map((part) => Number(part.trim()));

  if (values.length === 1 && Number.isNaN(values[0])) {
    return [];
  }

  if (values.some((value) => !Number.isFinite(value))) {
    return undefined;
  }

  return values;
}

function serializeVector(values?: number[]): string | null {
  if (!values || values.length === 0) {
    return null;
  }
  return `[${values.join(",")}]`;
}

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required when using the postgres store backend.");
  }

  const requireSsl =
    process.env.POSTGRES_SSL === "true" ||
    process.env.PGSSL === "true" ||
    (process.env.NODE_ENV === "production" && !connectionString.includes("localhost"));

  pool = new Pool({
    connectionString,
    ssl: requireSsl ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
}

function mapArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: row.tags ?? [],
    sourceUrl: row.source_url,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapChunk(row: ChunkRow): Chunk {
  return {
    id: row.id,
    articleId: row.article_id,
    content: row.content,
    tokenCount: row.token_count,
    startChar: row.start_char,
    endChar: row.end_char,
    embedding: parseVector(row.embedding),
    metadata: {
      title: row.metadata_title,
      sourceUrl: row.metadata_source_url,
      tags: row.metadata_tags ?? [],
    },
  };
}

function mapTrace(row: TraceRow): Trace {
  return {
    id: row.id,
    question: row.question,
    rewrittenQuery: row.rewritten_query,
    retrievalMode: row.retrieval_mode,
    retrieval: row.retrieval,
    model: row.model,
    latencyMs: row.latency_ms,
    tokenUsage: row.token_usage ?? undefined,
    estimatedCostUsd: Number(row.estimated_cost_usd),
    createdAt: toIsoString(row.created_at),
  };
}

function mapEscalation(row: EscalationRow): Escalation {
  return {
    id: row.id,
    question: row.question,
    createdAt: toIsoString(row.created_at),
    confidence: Number(row.confidence),
    reason: row.reason,
    answer: row.answer,
    citations: row.citations ?? [],
    resolved: row.resolved,
    resolutionNotes: row.resolution_notes ?? undefined,
  };
}

export class PgvectorKnowledgeStore implements KnowledgeStore {
  async listArticles(): Promise<Article[]> {
    const client = getPool();
    const result = await client.query<ArticleRow>(
      "SELECT id, title, body, tags, source_url, created_at, updated_at FROM support_articles ORDER BY created_at DESC",
    );
    return result.rows.map(mapArticle);
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const client = getPool();
    const result = await client.query<ArticleRow>(
      "SELECT id, title, body, tags, source_url, created_at, updated_at FROM support_articles WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? mapArticle(result.rows[0]) : undefined;
  }

  async createArticle(input: Omit<Article, "id" | "createdAt" | "updatedAt">): Promise<Article> {
    const client = getPool();
    const now = new Date().toISOString();
    const id = makeId("article");
    const result = await client.query<ArticleRow>(
      `INSERT INTO support_articles (id, title, body, tags, source_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4::text[], $5, $6::timestamptz, $6::timestamptz)
       RETURNING id, title, body, tags, source_url, created_at, updated_at`,
      [id, input.title, input.body, input.tags, input.sourceUrl, now],
    );
    return mapArticle(result.rows[0]);
  }

  async listChunks(): Promise<Chunk[]> {
    const client = getPool();
    const result = await client.query<ChunkRow>(
      `SELECT id, article_id, content, token_count, start_char, end_char, embedding::text AS embedding,
              metadata_title, metadata_source_url, metadata_tags
       FROM support_chunks
       ORDER BY created_at DESC`,
    );
    return result.rows.map(mapChunk);
  }

  async upsertChunks(chunks: Chunk[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    const client = getPool();
    const conn = await client.connect();
    try {
      await conn.query("BEGIN");
      for (const chunk of chunks) {
        if (chunk.embedding && chunk.embedding.length !== embeddingDimension) {
          throw new Error(
            `Chunk ${chunk.id} embedding length ${chunk.embedding.length} does not match PGVECTOR_EMBEDDING_DIM=${embeddingDimension}.`,
          );
        }

        const serialized = serializeVector(chunk.embedding);
        await conn.query(
          `INSERT INTO support_chunks (
             id, article_id, content, token_count, start_char, end_char, embedding,
             metadata_title, metadata_source_url, metadata_tags, updated_at
           )
           VALUES (
             $1, $2, $3, $4, $5, $6,
             CASE WHEN $7::text IS NULL THEN NULL ELSE $7::vector END,
             $8, $9, $10::text[], NOW()
           )
           ON CONFLICT (id) DO UPDATE SET
             article_id = EXCLUDED.article_id,
             content = EXCLUDED.content,
             token_count = EXCLUDED.token_count,
             start_char = EXCLUDED.start_char,
             end_char = EXCLUDED.end_char,
             embedding = EXCLUDED.embedding,
             metadata_title = EXCLUDED.metadata_title,
             metadata_source_url = EXCLUDED.metadata_source_url,
             metadata_tags = EXCLUDED.metadata_tags,
             updated_at = NOW()`,
          [
            chunk.id,
            chunk.articleId,
            chunk.content,
            chunk.tokenCount,
            chunk.startChar,
            chunk.endChar,
            serialized,
            chunk.metadata.title,
            chunk.metadata.sourceUrl,
            chunk.metadata.tags,
          ],
        );
      }
      await conn.query("COMMIT");
    } catch (error) {
      await conn.query("ROLLBACK");
      throw error;
    } finally {
      conn.release();
    }
  }
}

export class PgvectorRunStore implements RunStore {
  async saveTrace(trace: Trace): Promise<void> {
    const client = getPool();
    const conn = await client.connect();

    try {
      await conn.query("BEGIN");
      await conn.query(
        `INSERT INTO support_traces (
           id, question, rewritten_query, retrieval_mode, retrieval, model, latency_ms,
           token_usage, estimated_cost_usd, created_at
         )
         VALUES (
           $1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9, $10::timestamptz
         )`,
        [
          trace.id,
          trace.question,
          trace.rewrittenQuery,
          trace.retrievalMode,
          JSON.stringify(trace.retrieval),
          trace.model,
          trace.latencyMs,
          trace.tokenUsage ? JSON.stringify(trace.tokenUsage) : null,
          trace.estimatedCostUsd,
          trace.createdAt,
        ],
      );

      await conn.query(
        `DELETE FROM support_traces
         WHERE id IN (
           SELECT id
           FROM support_traces
           ORDER BY created_at DESC
           OFFSET $1
         )`,
        [RAG_CONFIG.maxSavedTraces],
      );

      await conn.query("COMMIT");
    } catch (error) {
      await conn.query("ROLLBACK");
      throw error;
    } finally {
      conn.release();
    }
  }

  async listRecentTraces(limit: number): Promise<Trace[]> {
    const client = getPool();
    const boundedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
    const result = await client.query<TraceRow>(
      `SELECT id, question, rewritten_query, retrieval_mode, retrieval, model, latency_ms,
              token_usage, estimated_cost_usd, created_at
       FROM support_traces
       ORDER BY created_at DESC
       LIMIT $1`,
      [boundedLimit],
    );
    return result.rows.map(mapTrace);
  }

  async enqueueEscalation(item: Escalation): Promise<void> {
    const client = getPool();
    await client.query(
      `INSERT INTO support_escalations (
         id, question, created_at, confidence, reason, answer, citations, resolved, resolution_notes
       )
       VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7::jsonb, $8, $9)`,
      [
        item.id,
        item.question,
        item.createdAt,
        item.confidence,
        item.reason,
        item.answer,
        JSON.stringify(item.citations),
        item.resolved,
        item.resolutionNotes ?? null,
      ],
    );
  }

  async listEscalations(): Promise<Escalation[]> {
    const client = getPool();
    const result = await client.query<EscalationRow>(
      `SELECT id, question, created_at, confidence, reason, answer, citations, resolved, resolution_notes
       FROM support_escalations
       ORDER BY created_at DESC`,
    );
    return result.rows.map(mapEscalation);
  }

  async resolveEscalation(id: string, notes?: string): Promise<void> {
    const client = getPool();
    await client.query(
      `UPDATE support_escalations
       SET resolved = TRUE,
           resolution_notes = COALESCE($2, resolution_notes)
       WHERE id = $1`,
      [id, notes ?? null],
    );
  }
}

export async function resetPgvectorStore(): Promise<void> {
  const client = getPool();
  await client.query(
    "TRUNCATE TABLE support_chunks, support_articles, support_traces, support_escalations RESTART IDENTITY CASCADE",
  );
}
