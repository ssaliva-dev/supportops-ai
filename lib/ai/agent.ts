import { MODEL_CONFIG, RAG_CONFIG } from "@/lib/config";
import { estimateCostUsd } from "@/lib/ai/cost";
import { isLegalOrFinancialGuaranteeRequest, selectEscalationReason } from "@/lib/ai/escalation";
import { buildUserPrompt, SYSTEM_PROMPT_V1 } from "@/lib/ai/prompts/v1";
import { getOpenAIClient } from "@/lib/ai/openai";
import { retrieveRelevantChunks } from "@/lib/rag/retrieval";
import { runStore } from "@/lib/store";
import { makeId } from "@/lib/utils/id";
import { snippet } from "@/lib/utils/text";
import type { AgentAnswer, Chunk, Citation, Escalation, EscalationReason, TokenUsage, Trace } from "@/types/domain";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeScore(score: number, mode: "embedding" | "keyword"): number {
  if (mode === "embedding") {
    return clamp01((score + 1) / 2);
  }
  return clamp01(score);
}

function rewriteQuestion(question: string): string {
  return question.replace(/^(hi|hello|hey)[,.!\s]*/i, "").trim();
}

function buildCitations(results: Array<{ chunk: Chunk; score: number }>, selectedChunkIds: string[]): Citation[] {
  const selectedSet = new Set(selectedChunkIds);
  const filtered = results.filter((entry) => (selectedSet.size ? selectedSet.has(entry.chunk.id) : true)).slice(0, 3);

  return filtered.map((entry) => ({
    chunkId: entry.chunk.id,
    articleId: entry.chunk.articleId,
    title: entry.chunk.metadata.title,
    sourceUrl: entry.chunk.metadata.sourceUrl,
    snippet: snippet(entry.chunk.content),
    score: Number(entry.score.toFixed(4)),
  }));
}

function fallbackAnswerFromChunks(question: string, chunks: Chunk[]): string {
  if (!chunks.length) {
    return "I do not know based on the available support documentation. Please escalate this case to a human support specialist.";
  }

  const sentencePool = chunks
    .slice(0, 2)
    .flatMap((chunk) => chunk.content.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const keySentences = sentencePool.slice(0, 3);
  const prefix = `From the available documentation for \"${question}\":`;

  return `${prefix} ${keySentences.join(" ")}`.trim();
}

function safeJsonParse(raw: string): {
  answer?: string;
  confidence?: number;
  citationChunkIds?: string[];
  shouldEscalate?: boolean;
  escalationReason?: EscalationReason;
} {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function maybeExtractJson(content: string): string {
  const match = content.match(/\{[\s\S]*\}$/);
  return match ? match[0] : content;
}

function escalationMessage(reason: EscalationReason): string {
  if (reason === "NO_RELEVANT_CONTEXT") {
    return "I do not know based on available support context. Please escalate this case to a human specialist.";
  }
  if (reason === "CONFLICTING_SOURCES") {
    return "The retrieved support sources conflict on key policy details. Please escalate to a human specialist for a definitive answer.";
  }
  if (reason === "LEGAL_OR_FINANCIAL_REQUEST") {
    return "I cannot provide legal or financial guarantees from support documentation alone. Please escalate this request to the appropriate team.";
  }
  return "I am not confident enough to answer reliably from the retrieved context. Please escalate this case to a human specialist.";
}

export async function runSupportAgent(question: string): Promise<{ answer: AgentAnswer; trace: Trace }> {
  const startedAt = Date.now();
  const rewrittenQuery = rewriteQuestion(question);

  const retrieval = await retrieveRelevantChunks({
    question: rewrittenQuery || question,
    topK: RAG_CONFIG.topK,
  });

  const topScore = retrieval.results[0]?.score ?? 0;
  const averageScore =
    retrieval.results.length > 0
      ? retrieval.results.reduce((sum, item) => sum + item.score, 0) / retrieval.results.length
      : 0;

  const normalizedTopScore = normalizeScore(topScore, retrieval.mode);
  const relevanceThreshold = retrieval.mode === "embedding" ? 0.42 : 0.35;
  const hasRelevantContext = retrieval.results.length > 0 && normalizedTopScore >= relevanceThreshold;
  const retrievalConfidence = clamp01(normalizedTopScore * 0.75 + Math.min(retrieval.results.length, 3) * 0.08);
  const legalOrFinancial = isLegalOrFinancialGuaranteeRequest(question);

  const selectedChunks = hasRelevantContext ? retrieval.results.map((item) => item.chunk) : [];
  const prompt = buildUserPrompt(question, selectedChunks);

  const client = getOpenAIClient();
  let usage: TokenUsage | undefined;
  let modelAnswer = "";
  let llmConfidence: number | undefined;
  let selectedChunkIds: string[] = [];

  if (client && selectedChunks.length > 0) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL_CONFIG.answerModel,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT_V1 },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = completion.choices[0]?.message?.content ?? "{}";
      const parsed = safeJsonParse(maybeExtractJson(rawContent));
      modelAnswer = typeof parsed.answer === "string" ? parsed.answer : "";
      llmConfidence = typeof parsed.confidence === "number" ? clamp01(parsed.confidence) : undefined;
      selectedChunkIds = Array.isArray(parsed.citationChunkIds)
        ? parsed.citationChunkIds.filter((value): value is string => typeof value === "string")
        : [];

      usage = completion.usage
        ? {
            prompt: completion.usage.prompt_tokens,
            completion: completion.usage.completion_tokens,
            total: completion.usage.total_tokens,
          }
        : undefined;
    } catch {
      modelAnswer = "";
    }
  }

  const citations = hasRelevantContext ? buildCitations(retrieval.results, selectedChunkIds) : [];
  const confidence = clamp01(
    llmConfidence !== undefined ? (llmConfidence + retrievalConfidence) / 2 : retrievalConfidence - (citations.length ? 0 : 0.15),
  );

  const escalationReason = selectEscalationReason({
    hasRelevantContext,
    hasConflict: retrieval.hasConflict,
    isLegalOrFinancial: legalOrFinancial,
    confidence,
    minimumConfidence: RAG_CONFIG.minConfidence,
  });

  const shouldEscalate = Boolean(escalationReason);

  const answerText = modelAnswer || fallbackAnswerFromChunks(question, selectedChunks);
  const answer: AgentAnswer = {
    answer: shouldEscalate && escalationReason ? escalationMessage(escalationReason) : answerText,
    confidence: Number(confidence.toFixed(3)),
    citations,
    shouldEscalate,
    escalationReason,
  };

  const latencyMs = Date.now() - startedAt;
  const estimatedCostUsd = estimateCostUsd(usage);

  const trace: Trace = {
    id: makeId("trace"),
    question,
    rewrittenQuery: rewrittenQuery || question,
    retrievalMode: retrieval.mode,
    retrieval: {
      selectedChunkIds: retrieval.results.map((item) => item.chunk.id),
      scores: Object.fromEntries(retrieval.results.map((item) => [item.chunk.id, Number(item.score.toFixed(4))])),
      topScore: Number(topScore.toFixed(4)),
      averageScore: Number(averageScore.toFixed(4)),
      hasConflict: retrieval.hasConflict,
    },
    model: client ? MODEL_CONFIG.answerModel : "fallback-no-llm",
    latencyMs,
    tokenUsage: usage,
    estimatedCostUsd,
    createdAt: new Date().toISOString(),
  };

  await runStore.saveTrace(trace);

  if (shouldEscalate) {
    const escalation: Escalation = {
      id: makeId("esc"),
      question,
      createdAt: new Date().toISOString(),
      confidence: answer.confidence,
      reason: escalationReason ?? "LOW_CONFIDENCE",
      answer: answer.answer,
      citations: answer.citations,
      resolved: false,
    };
    await runStore.enqueueEscalation(escalation);
  }

  return { answer, trace };
}
