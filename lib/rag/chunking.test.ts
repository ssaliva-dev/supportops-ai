import { describe, expect, it } from "vitest";

import { chunkArticle, splitIntoChunks } from "@/lib/rag/chunking";
import type { Article } from "@/types/domain";

describe("chunking", () => {
  it("splits long content into multiple chunks with overlap", () => {
    const content = "Sentence one. ".repeat(150);
    const chunks = splitIntoChunks(content, { chunkSize: 240, overlap: 30 });

    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks[0].content.length).toBeLessThanOrEqual(240);
    expect(chunks[1].startChar).toBeLessThan(chunks[0].endChar);
  });

  it("maps article metadata into chunk structure", () => {
    const article: Article = {
      id: "article_1",
      title: "Refund Policy",
      body: "Refunds are available within 30 days. Duplicate charges are refundable.",
      tags: ["refund", "billing"],
      sourceUrl: "https://example.com/refunds",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const chunks = chunkArticle(article, { chunkSize: 60, overlap: 10 });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].articleId).toBe(article.id);
    expect(chunks[0].metadata.title).toBe(article.title);
    expect(chunks[0].metadata.sourceUrl).toBe(article.sourceUrl);
  });
});
