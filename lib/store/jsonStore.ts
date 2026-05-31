import { promises as fs } from "node:fs";
import path from "node:path";

import type { Article, Chunk, Escalation, Trace } from "@/types/domain";
import type { KnowledgeStore, RunStore } from "@/lib/store/types";
import { makeId } from "@/lib/utils/id";

const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");
const DATA_DIR = resolveDataDir();
const ARTICLE_FILE = path.join(DATA_DIR, "articles.json");
const CHUNK_FILE = path.join(DATA_DIR, "chunks.json");
const TRACE_FILE = path.join(DATA_DIR, "traces.json");
const ESCALATION_FILE = path.join(DATA_DIR, "escalations.json");
const BUNDLED_FILES = {
  articles: path.join(BUNDLED_DATA_DIR, "articles.json"),
  chunks: path.join(BUNDLED_DATA_DIR, "chunks.json"),
  traces: path.join(BUNDLED_DATA_DIR, "traces.json"),
  escalations: path.join(BUNDLED_DATA_DIR, "escalations.json"),
};

type FileKey = keyof typeof BUNDLED_FILES;

function resolveDataDir(): string {
  const configured = process.env.SUPPORTOPS_DATA_DIR?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.VERCEL === "1") {
    return path.join("/tmp", "supportops-data");
  }

  return BUNDLED_DATA_DIR;
}

function toErrno(error: unknown): NodeJS.ErrnoException {
  return error as NodeJS.ErrnoException;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveFileKey(filePath: string): FileKey | null {
  if (filePath === ARTICLE_FILE) {
    return "articles";
  }
  if (filePath === CHUNK_FILE) {
    return "chunks";
  }
  if (filePath === TRACE_FILE) {
    return "traces";
  }
  if (filePath === ESCALATION_FILE) {
    return "escalations";
  }
  return null;
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function bootstrapFromBundledFile(filePath: string): Promise<void> {
  await ensureDataDir();
  if (await exists(filePath)) {
    return;
  }

  const key = resolveFileKey(filePath);
  if (!key) {
    return;
  }

  const bundled = BUNDLED_FILES[key];
  if (bundled === filePath) {
    return;
  }

  try {
    await fs.copyFile(bundled, filePath);
  } catch (error) {
    if (toErrno(error).code !== "ENOENT") {
      throw error;
    }
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await bootstrapFromBundledFile(filePath);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const errno = toErrno(error);
    if (errno.code === "ENOENT" || errno.name === "SyntaxError") {
      try {
        await writeJson(filePath, fallback);
      } catch (writeError) {
        if (toErrno(writeError).code !== "EROFS") {
          throw writeError;
        }
      }
      return structuredClone(fallback);
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
