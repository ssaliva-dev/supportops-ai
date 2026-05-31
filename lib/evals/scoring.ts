import { normalizeText } from "@/lib/utils/text";
import type { AgentAnswer, EvalCase, EvalResult } from "@/types/domain";

function overlapRatio(answer: string, reference: string): number {
  const answerWords = new Set(normalizeText(answer).split(" ").filter((word) => word.length > 2));
  const referenceWords = new Set(normalizeText(reference).split(" ").filter((word) => word.length > 2));

  if (answerWords.size === 0 || referenceWords.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const word of answerWords) {
    if (referenceWords.has(word)) {
      overlap += 1;
    }
  }

  return overlap / answerWords.size;
}

function containsFact(answer: string, fact: string): boolean {
  const normalizedAnswer = normalizeText(answer);
  const normalizedFact = normalizeText(fact);
  return normalizedFact.length > 0 && normalizedAnswer.includes(normalizedFact);
}

export function scoreEvalCase(input: {
  evalCase: EvalCase;
  agentAnswer: AgentAnswer;
  selectedSourceUrls: string[];
  latencyMs: number;
}): EvalResult {
  const { evalCase, agentAnswer, selectedSourceUrls, latencyMs } = input;

  const citationPresent = agentAnswer.citations.length > 0;
  const citationSources = new Set(agentAnswer.citations.map((citation) => citation.sourceUrl));
  const retrievedSources = new Set(selectedSourceUrls);

  const retrievalHit =
    evalCase.expectedSources.length === 0
      ? selectedSourceUrls.length === 0 || agentAnswer.shouldEscalate
      : evalCase.expectedSources.some((source) => citationSources.has(source) || retrievedSources.has(source));

  const escalationCorrect = agentAnswer.shouldEscalate === evalCase.expectedEscalation;

  const factHits = evalCase.expectedFacts.filter((fact) => containsFact(agentAnswer.answer, fact)).length;
  const factCoverage = evalCase.expectedFacts.length === 0 ? 1 : factHits / evalCase.expectedFacts.length;

  const citationContext = agentAnswer.citations.map((citation) => citation.snippet).join(" ");
  const groundedness = citationPresent
    ? Math.max(0, Math.min(1, overlapRatio(agentAnswer.answer, citationContext) + factCoverage * 0.35))
    : 0;

  const pass = evalCase.expectedEscalation
    ? escalationCorrect && retrievalHit
    : retrievalHit && escalationCorrect && citationPresent && groundedness >= 0.35 && factCoverage >= 0.4;

  return {
    caseId: evalCase.id,
    question: evalCase.question,
    expectedSources: evalCase.expectedSources,
    answer: agentAnswer.answer,
    pass,
    groundedness: Number(groundedness.toFixed(3)),
    retrievalHit,
    citationPresent,
    escalationCorrect,
    latencyMs,
  };
}
