import { JsonKnowledgeStore, JsonRunStore, resetDataStore as resetJsonStore } from "@/lib/store/jsonStore";
import {
  PgvectorKnowledgeStore,
  PgvectorRunStore,
  resetPgvectorStore,
} from "@/lib/store/pgvectorStore";
import type { KnowledgeStore, RunStore } from "@/lib/store/types";

type StoreBackend = "json" | "postgres";

function resolveBackend(): StoreBackend {
  const requested = process.env.STORE_BACKEND?.trim().toLowerCase();
  if (requested === "json" || requested === "postgres") {
    return requested;
  }

  if (process.env.NODE_ENV === "test") {
    return "json";
  }

  return process.env.DATABASE_URL ? "postgres" : "json";
}

const backend = resolveBackend();

if (backend === "postgres" && !process.env.DATABASE_URL) {
  throw new Error("STORE_BACKEND=postgres requires DATABASE_URL.");
}

const jsonKnowledgeStore = new JsonKnowledgeStore();
const jsonRunStore = new JsonRunStore();

const postgresKnowledgeStore = new PgvectorKnowledgeStore();
const postgresRunStore = new PgvectorRunStore();

export const knowledgeStore: KnowledgeStore =
  backend === "postgres" ? postgresKnowledgeStore : jsonKnowledgeStore;

export const runStore: RunStore = backend === "postgres" ? postgresRunStore : jsonRunStore;

export async function resetDataStore(): Promise<void> {
  if (backend === "postgres") {
    await resetPgvectorStore();
    return;
  }
  await resetJsonStore();
}

export function getStoreBackend(): StoreBackend {
  return backend;
}
