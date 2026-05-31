import { evalCases } from "@/lib/evals/cases";
import { scoreEvalCase } from "@/lib/evals/scoring";
import { runSupportAgent } from "@/lib/ai/agent";
import { knowledgeStore } from "@/lib/store";
import type { EvalRunResponse, EvalSummary } from "@/types/domain";

function buildSummary(results: EvalRunResponse["results"]): EvalSummary {
  const total = results.length || 1;
  const passCount = results.filter((result) => result.pass).length;
  const groundednessSum = results.reduce((sum, result) => sum + result.groundedness, 0);
  const latencySum = results.reduce((sum, result) => sum + result.latencyMs, 0);
  const escalationCorrectCount = results.filter((result) => result.escalationCorrect).length;
  const retrievalHitCount = results.filter((result) => result.retrievalHit).length;

  return {
    passRate: Number((passCount / total).toFixed(3)),
    averageGroundedness: Number((groundednessSum / total).toFixed(3)),
    averageLatencyMs: Number((latencySum / total).toFixed(1)),
    escalationAccuracy: Number((escalationCorrectCount / total).toFixed(3)),
    retrievalHitRate: Number((retrievalHitCount / total).toFixed(3)),
  };
}

export async function runEvalSuite(): Promise<EvalRunResponse> {
  const chunks = await knowledgeStore.listChunks();
  const sourceByChunkId = new Map(chunks.map((chunk) => [chunk.id, chunk.metadata.sourceUrl]));

  const results: EvalRunResponse["results"] = [];

  for (const evalCase of evalCases) {
    const started = Date.now();
    const { answer, trace } = await runSupportAgent(evalCase.question);
    const selectedSources = trace.retrieval.selectedChunkIds
      .map((chunkId) => sourceByChunkId.get(chunkId))
      .filter((source): source is string => Boolean(source));

    results.push(
      scoreEvalCase({
        evalCase,
        agentAnswer: answer,
        selectedSourceUrls: selectedSources,
        latencyMs: Date.now() - started,
      }),
    );
  }

  return {
    results,
    summary: buildSummary(results),
  };
}
