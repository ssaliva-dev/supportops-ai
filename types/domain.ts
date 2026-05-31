export type Article = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type Chunk = {
  id: string;
  articleId: string;
  content: string;
  tokenCount: number;
  startChar: number;
  endChar: number;
  embedding?: number[];
  metadata: {
    title: string;
    sourceUrl: string;
    tags: string[];
  };
};

export type RetrievalMode = "embedding" | "keyword";

export type Citation = {
  chunkId: string;
  articleId: string;
  title: string;
  sourceUrl: string;
  snippet: string;
  score: number;
};

export type EscalationReason =
  | "NO_RELEVANT_CONTEXT"
  | "LOW_CONFIDENCE"
  | "CONFLICTING_SOURCES"
  | "LEGAL_OR_FINANCIAL_REQUEST";

export type AgentAnswer = {
  answer: string;
  confidence: number;
  citations: Citation[];
  shouldEscalate: boolean;
  escalationReason?: EscalationReason;
};

export type TokenUsage = {
  prompt: number;
  completion: number;
  total: number;
};

export type Trace = {
  id: string;
  question: string;
  rewrittenQuery: string;
  retrievalMode: RetrievalMode;
  retrieval: {
    selectedChunkIds: string[];
    scores: Record<string, number>;
    topScore: number;
    averageScore: number;
    hasConflict: boolean;
  };
  model: string;
  latencyMs: number;
  tokenUsage?: TokenUsage;
  estimatedCostUsd: number;
  createdAt: string;
};

export type Escalation = {
  id: string;
  question: string;
  createdAt: string;
  confidence: number;
  reason: EscalationReason;
  answer: string;
  citations: Citation[];
  resolved: boolean;
  resolutionNotes?: string;
};

export type EvalCase = {
  id: string;
  question: string;
  expectedFacts: string[];
  expectedSources: string[];
  expectedEscalation: boolean;
};

export type EvalResult = {
  caseId: string;
  question: string;
  expectedSources: string[];
  answer: string;
  pass: boolean;
  groundedness: number;
  retrievalHit: boolean;
  citationPresent: boolean;
  escalationCorrect: boolean;
  latencyMs: number;
};

export type EvalSummary = {
  passRate: number;
  averageGroundedness: number;
  averageLatencyMs: number;
  escalationAccuracy: number;
  retrievalHitRate: number;
};

export type EvalRunResponse = {
  results: EvalResult[];
  summary: EvalSummary;
};
