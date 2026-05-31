export const RAG_CONFIG = {
  chunkSize: 280,
  chunkOverlap: 60,
  topK: 4,
  minKeywordScore: 0.1,
  minConfidence: 0.5,
  maxSavedTraces: 50,
};

export const MODEL_CONFIG = {
  answerModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
};

export const COST_TABLE = {
  [MODEL_CONFIG.answerModel]: {
    inputPer1M: 0.4,
    outputPer1M: 1.6,
  },
};
