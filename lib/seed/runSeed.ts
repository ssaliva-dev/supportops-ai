import { knowledgeStore, resetDataStore } from "@/lib/store";
import { seedArticles } from "@/lib/seed/seedArticles";
import { chunkArticle } from "@/lib/rag/chunking";
import { embedTexts } from "@/lib/ai/embeddings";

export async function seedKnowledgeBase(): Promise<{ articleCount: number; chunkCount: number }> {
  await resetDataStore();

  let chunkCount = 0;

  for (const articleInput of seedArticles) {
    const article = await knowledgeStore.createArticle(articleInput);
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
    chunkCount += chunks.length;
  }

  return {
    articleCount: seedArticles.length,
    chunkCount,
  };
}
