import { RAG_CONFIG } from "@/lib/config";
import { knowledgeStore } from "@/lib/store";
import { normalizeText } from "@/lib/utils/text";
import type { Chunk, RetrievalMode } from "@/types/domain";
import { embedTexts } from "@/lib/ai/embeddings";

export type RetrievalResult = {
  mode: RetrievalMode;
  results: Array<{ chunk: Chunk; score: number }>;
  hasConflict: boolean;
};

type PolicySignal = {
  key: string;
  value: string;
  deprecated: boolean;
};

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "if",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "the",
  "to",
  "we",
  "what",
  "when",
  "who",
  "with",
  "you",
  "your",
]);

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    magA += a[index] ** 2;
    magB += b[index] ** 2;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) {
    return 0;
  }

  return dot / denom;
}

function keywordScore(query: string, chunk: Chunk): number {
  const normalizedQuery = normalizeText(query);
  const queryTerms = normalizedQuery
    .split(" ")
    .filter((term) => term.length > 2)
    .filter((term) => !STOPWORDS.has(term));

  const title = normalizeText(chunk.metadata.title);
  const tags = normalizeText(chunk.metadata.tags.join(" "));
  const content = normalizeText(chunk.content);
  const haystack = `${title} ${tags} ${content}`;

  if (queryTerms.length === 0) {
    return 0;
  }

  let textHits = 0;
  let titleHits = 0;
  let tagHits = 0;
  for (const term of queryTerms) {
    if (haystack.includes(term)) {
      textHits += 1;
    }
    if (title.includes(term)) {
      titleHits += 1;
    }
    if (tags.includes(term)) {
      tagHits += 1;
    }
  }

  const base = textHits / queryTerms.length;
  const titleBoost = (titleHits / queryTerms.length) * 0.22;
  const tagBoost = (tagHits / queryTerms.length) * 0.2;
  const deprecatedPenalty = chunk.metadata.tags.includes("deprecated") ? -0.12 : 0;

  return Math.max(0, base + titleBoost + tagBoost + deprecatedPenalty);
}

function extractSignals(chunk: Chunk): PolicySignal[] {
  const signals: PolicySignal[] = [];
  const content = chunk.content.toLowerCase();
  const deprecated = chunk.metadata.tags.includes("deprecated") || content.includes("legacy");

  const refundMatch =
    content.match(/(\d+)\s*(?:calendar\s*)?days?[^.\n]{0,40}refund/) ??
    content.match(/refund[^.\n]{0,40}(\d+)\s*(?:calendar\s*)?days?/);
  if (refundMatch?.[1]) {
    signals.push({ key: "refund_window_days", value: refundMatch[1], deprecated });
  }

  const apiMatch = content.match(/(\d+)\s*requests per minute/);
  if (apiMatch) {
    signals.push({ key: "api_rpm", value: apiMatch[1], deprecated });
  }

  const slaMatch = content.match(/(\d+(?:\.\d+)?)%\s*monthly uptime/);
  if (slaMatch) {
    signals.push({ key: "sla_uptime", value: slaMatch[1], deprecated });
  }

  return signals;
}

function detectConflict(chunks: Chunk[], question: string): boolean {
  const signals = chunks.flatMap(extractSignals);
  const normalizedQuestion = normalizeText(question);
  const asksAboutLegacy =
    normalizedQuestion.includes("legacy") ||
    normalizedQuestion.includes("deprecated") ||
    normalizedQuestion.includes("conflict") ||
    normalizedQuestion.includes("different");
  const grouped = new Map<string, { active: Set<string>; all: Set<string> }>();

  for (const signal of signals) {
    if (!grouped.has(signal.key)) {
      grouped.set(signal.key, { active: new Set(), all: new Set() });
    }
    const bucket = grouped.get(signal.key)!;
    bucket.all.add(signal.value);
    if (!signal.deprecated) {
      bucket.active.add(signal.value);
    }
  }

  for (const [, bucket] of grouped) {
    if (bucket.active.size > 1) {
      return true;
    }
    if (asksAboutLegacy && bucket.active.size === 1 && bucket.all.size > 1) {
      return true;
    }
  }

  return false;
}

async function rankByEmbeddings(question: string, chunks: Chunk[]): Promise<Array<{ chunk: Chunk; score: number }>> {
  const queryVectors = await embedTexts([question]);
  if (!queryVectors || queryVectors.length !== 1) {
    return [];
  }

  const queryVector = queryVectors[0];

  const missing = chunks.filter((chunk) => !chunk.embedding);
  if (missing.length > 0) {
    const vectors = await embedTexts(missing.map((chunk) => chunk.content));
    if (vectors && vectors.length === missing.length) {
      missing.forEach((chunk, index) => {
        chunk.embedding = vectors[index];
      });
      await knowledgeStore.upsertChunks(missing);
    }
  }

  return chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, chunk.embedding ?? []) + (chunk.metadata.tags.includes("deprecated") ? -0.1 : 0),
    }))
    .sort((left, right) => right.score - left.score);
}

function rankByKeyword(question: string, chunks: Chunk[]): Array<{ chunk: Chunk; score: number }> {
  return chunks
    .map((chunk) => ({
      chunk,
      score: keywordScore(question, chunk),
    }))
    .filter((entry) => entry.score >= RAG_CONFIG.minKeywordScore)
    .sort((left, right) => right.score - left.score);
}

export async function retrieveRelevantChunks(args: {
  question: string;
  topK?: number;
}): Promise<RetrievalResult> {
  const topK = args.topK ?? RAG_CONFIG.topK;
  const chunks = await knowledgeStore.listChunks();

  if (chunks.length === 0) {
    return {
      mode: process.env.OPENAI_API_KEY ? "embedding" : "keyword",
      results: [],
      hasConflict: false,
    };
  }

  const useEmbeddings = Boolean(process.env.OPENAI_API_KEY);
  let mode: RetrievalMode = useEmbeddings ? "embedding" : "keyword";
  let ranked: Array<{ chunk: Chunk; score: number }> = [];

  if (useEmbeddings) {
    try {
      ranked = await rankByEmbeddings(args.question, chunks);
    } catch {
      mode = "keyword";
    }
  }

  if (!ranked.length) {
    mode = "keyword";
    ranked = rankByKeyword(args.question, chunks);
  }

  const results = ranked.slice(0, topK);
  const hasConflict = detectConflict(
    results.map((entry) => entry.chunk),
    args.question,
  );

  return {
    mode,
    results,
    hasConflict,
  };
}
