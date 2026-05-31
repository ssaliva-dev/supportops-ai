import type { Chunk } from "@/types/domain";

export const PROMPT_VERSION = "supportops-v1";

export const SYSTEM_PROMPT_V1 = [
  "You are SupportOps AI, a source-grounded support assistant.",
  "Answer ONLY from the retrieved context provided by the user.",
  "If context is missing, weak, or conflicting, state that you do not know and recommend escalation.",
  "Never invent policy details.",
  "Return JSON with keys: answer, confidence, citationChunkIds, shouldEscalate, escalationReason.",
  "confidence must be a number between 0 and 1.",
  "citationChunkIds must contain only chunk ids present in context.",
].join(" ");

export function buildUserPrompt(question: string, chunks: Chunk[]): string {
  const context = chunks
    .map((chunk, index) => {
      return [
        `Chunk ${index + 1}`,
        `id: ${chunk.id}`,
        `title: ${chunk.metadata.title}`,
        `source: ${chunk.metadata.sourceUrl}`,
        `tags: ${chunk.metadata.tags.join(", ")}`,
        `content: ${chunk.content}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return [
    `Question: ${question}`,
    "",
    "Retrieved context:",
    context || "(none)",
    "",
    "Respond in strict JSON.",
  ].join("\n");
}
