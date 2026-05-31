import type { Article, Chunk, Escalation, Trace } from "@/types/domain";

export type ScoredChunk = {
  chunk: Chunk;
  score: number;
};

export interface KnowledgeStore {
  listArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | undefined>;
  createArticle(input: Omit<Article, "id" | "createdAt" | "updatedAt">): Promise<Article>;
  listChunks(): Promise<Chunk[]>;
  upsertChunks(chunks: Chunk[]): Promise<void>;
}

export interface RunStore {
  saveTrace(trace: Trace): Promise<void>;
  listRecentTraces(limit: number): Promise<Trace[]>;
  enqueueEscalation(item: Escalation): Promise<void>;
  listEscalations(): Promise<Escalation[]>;
  resolveEscalation(id: string, notes?: string): Promise<void>;
}
