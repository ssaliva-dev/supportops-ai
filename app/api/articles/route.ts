import { NextResponse } from "next/server";

import { knowledgeStore } from "@/lib/store";
import { chunkArticle } from "@/lib/rag/chunking";
import { embedTexts } from "@/lib/ai/embeddings";

export const runtime = "nodejs";

export async function GET() {
  const articles = await knowledgeStore.listArticles();
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const articleBody = typeof body?.body === "string" ? body.body.trim() : "";
    const sourceUrl = typeof body?.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    const tags = Array.isArray(body?.tags)
      ? body.tags.map((tag: unknown) => String(tag).trim().toLowerCase()).filter(Boolean)
      : [];

    if (!title || !articleBody || !sourceUrl) {
      return NextResponse.json({ error: "title, body, and sourceUrl are required." }, { status: 400 });
    }

    const article = await knowledgeStore.createArticle({
      title,
      body: articleBody,
      sourceUrl,
      tags,
    });

    const chunks = chunkArticle(article);

    if (process.env.OPENAI_API_KEY) {
      const vectors = await embedTexts(chunks.map((chunk) => chunk.content));
      if (vectors && vectors.length === chunks.length) {
        chunks.forEach((chunk, index) => {
          chunk.embedding = vectors[index];
        });
      }
    }

    await knowledgeStore.upsertChunks(chunks);

    return NextResponse.json({
      article,
      chunkCount: chunks.length,
      retrievalMode: process.env.OPENAI_API_KEY ? "embedding" : "keyword",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create article.", detail: (error as Error).message },
      { status: 500 },
    );
  }
}
