import { beforeEach, describe, expect, it } from "vitest";

import { retrieveRelevantChunks } from "@/lib/rag/retrieval";
import { knowledgeStore, resetDataStore } from "@/lib/store/jsonStore";
import type { Chunk } from "@/types/domain";

const baseChunks: Chunk[] = [
  {
    id: "refund_chunk",
    articleId: "refund_article",
    content: "Customers can request a refund within 30 calendar days.",
    tokenCount: 12,
    startChar: 0,
    endChar: 56,
    metadata: {
      title: "Refund Policy",
      sourceUrl: "https://docs.supportopsai.dev/billing/refunds",
      tags: ["billing", "refund"],
    },
  },
  {
    id: "sso_chunk",
    articleId: "sso_article",
    content: "SAML SSO is available for Enterprise customers through Okta.",
    tokenCount: 15,
    startChar: 0,
    endChar: 61,
    metadata: {
      title: "Enterprise SSO",
      sourceUrl: "https://docs.supportopsai.dev/security/enterprise-sso",
      tags: ["security", "sso"],
    },
  },
];

describe("retrieval", () => {
  beforeEach(async () => {
    delete process.env.OPENAI_API_KEY;
    await resetDataStore();
    await knowledgeStore.upsertChunks(baseChunks);
  });

  it("falls back to keyword mode when OpenAI key is missing", async () => {
    const result = await retrieveRelevantChunks({ question: "What is the refund window?", topK: 2 });

    expect(result.mode).toBe("keyword");
    expect(result.results[0]?.chunk.id).toBe("refund_chunk");
  });

  it("detects conflicting retrieved sources", async () => {
    await knowledgeStore.upsertChunks([
      {
        id: "legacy_refund_chunk",
        articleId: "legacy_article",
        content: "Legacy contracts before 2024 had a 14 day refund window.",
        tokenCount: 11,
        startChar: 0,
        endChar: 56,
        metadata: {
          title: "Legacy Refund Terms",
          sourceUrl: "https://docs.supportopsai.dev/legacy/refund-terms",
          tags: ["billing", "refund", "deprecated"],
        },
      },
    ]);

    const result = await retrieveRelevantChunks({ question: "Which refund window applies for legacy vs current plans?" });

    expect(result.hasConflict).toBe(true);
  });
});
