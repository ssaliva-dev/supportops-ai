import { knowledgeStore } from "@/lib/store";
import { seedKnowledgeBase } from "@/lib/seed/runSeed";

let seedPromise: Promise<void> | null = null;

export async function ensureSeededData(): Promise<void> {
  const articles = await knowledgeStore.listArticles();
  if (articles.length > 0) {
    return;
  }

  if (!seedPromise) {
    seedPromise = seedKnowledgeBase().then(() => undefined);
  }

  await seedPromise;
}
