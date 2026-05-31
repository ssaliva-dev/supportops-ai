import { describe, expect, it } from "vitest";

import { scoreEvalCase } from "@/lib/evals/scoring";
import type { AgentAnswer, EvalCase } from "@/types/domain";

describe("eval scoring", () => {
  const evalCase: EvalCase = {
    id: "refund",
    question: "What is your refund policy?",
    expectedFacts: ["30 calendar days"],
    expectedSources: ["https://docs.supportopsai.dev/billing/refunds"],
    expectedEscalation: false,
  };

  it("passes when citations, retrieval, and facts align", () => {
    const answer: AgentAnswer = {
      answer: "You can request a full refund within 30 calendar days of purchase.",
      confidence: 0.78,
      shouldEscalate: false,
      citations: [
        {
          chunkId: "refund_chunk",
          articleId: "refund_article",
          title: "Refund Policy",
          sourceUrl: "https://docs.supportopsai.dev/billing/refunds",
          snippet: "Customers can request a full refund within 30 calendar days of purchase.",
          score: 0.92,
        },
      ],
    };

    const result = scoreEvalCase({
      evalCase,
      agentAnswer: answer,
      selectedSourceUrls: ["https://docs.supportopsai.dev/billing/refunds"],
      latencyMs: 120,
    });

    expect(result.pass).toBe(true);
    expect(result.retrievalHit).toBe(true);
    expect(result.escalationCorrect).toBe(true);
  });

  it("fails when escalation is expected but missing", () => {
    const escalateCase: EvalCase = {
      id: "missing-info",
      question: "Provide SOC 2 report",
      expectedFacts: ["escalate"],
      expectedSources: [],
      expectedEscalation: true,
    };

    const answer: AgentAnswer = {
      answer: "Here is everything you need.",
      confidence: 0.9,
      shouldEscalate: false,
      citations: [],
    };

    const result = scoreEvalCase({
      evalCase: escalateCase,
      agentAnswer: answer,
      selectedSourceUrls: [],
      latencyMs: 99,
    });

    expect(result.pass).toBe(false);
    expect(result.escalationCorrect).toBe(false);
  });
});
