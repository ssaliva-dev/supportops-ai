import { promises as fs } from "node:fs";
import path from "node:path";

import type { Article, Chunk, Escalation, Trace } from "@/types/domain";
import type { KnowledgeStore, RunStore } from "@/lib/store/types";
import { makeId } from "@/lib/utils/id";

const DATA_DIR = path.join(process.cwd(), "data");
const ARTICLE_FILE = path.join(DATA_DIR, "articles.json");
const CHUNK_FILE = path.join(DATA_DIR, "chunks.json");
const TRACE_FILE = path.join(DATA_DIR, "traces.json");
const ESCALATION_FILE = path.join(DATA_DIR, "escalations.json");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writeJson(filePath, fallback);
      return fallback;
    }
    throw error;
  }
}

async function writeJson<T>(filePath: string, value: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export class JsonKnowledgeStore implements KnowledgeStore {
  async listArticles(): Promise<Article[]> {
    return readJson<Article[]>(ARTICLE_FILE, []);
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const articles = await this.listArticles();
    return articles.find((article) => article.id === id);
  }

  async createArticle(input: Omit<Article, "id" | "createdAt" | "updatedAt">): Promise<Article> {
    const now = new Date().toISOString();
    const article: Article = {
      id: makeId("article"),
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    const articles = await this.listArticles();
    articles.unshift(article);
    await writeJson(ARTICLE_FILE, articles);
    return article;
  }

  async listChunks(): Promise<Chunk[]> {
    return readJson<Chunk[]>(CHUNK_FILE, []);
  }

  async upsertChunks(chunks: Chunk[]): Promise<void> {
    const existing = await this.listChunks();
    const map = new Map(existing.map((chunk) => [chunk.id, chunk]));

    for (const chunk of chunks) {
      map.set(chunk.id, chunk);
    }

    await writeJson(CHUNK_FILE, [...map.values()]);
  }
}

export class JsonRunStore implements RunStore {
  async saveTrace(trace: Trace): Promise<void> {
    const traces = await readJson<Trace[]>(TRACE_FILE, []);
    traces.unshift(trace);
    await writeJson(TRACE_FILE, traces.slice(0, 100));
  }

  async listRecentTraces(limit: number): Promise<Trace[]> {
    const traces = await readJson<Trace[]>(TRACE_FILE, []);
    return traces.slice(0, limit);
  }

  async enqueueEscalation(item: Escalation): Promise<void> {
    const escalations = await readJson<Escalation[]>(ESCALATION_FILE, []);
    escalations.unshift(item);
    await writeJson(ESCALATION_FILE, escalations);
  }

  async listEscalations(): Promise<Escalation[]> {
    return readJson<Escalation[]>(ESCALATION_FILE, []);
  }

  async resolveEscalation(id: string, notes?: string): Promise<void> {
    const escalations = await readJson<Escalation[]>(ESCALATION_FILE, []);
    const updated = escalations.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        resolved: true,
        resolutionNotes: notes,
      };
    });
    await writeJson(ESCALATION_FILE, updated);
  }
}

export const knowledgeStore = new JsonKnowledgeStore();
export const runStore = new JsonRunStore();

export async function resetDataStore(): Promise<void> {
  await Promise.all([
    writeJson(ARTICLE_FILE, []),
    writeJson(CHUNK_FILE, []),
    writeJson(TRACE_FILE, []),
    writeJson(ESCALATION_FILE, []),
  ]);
}
