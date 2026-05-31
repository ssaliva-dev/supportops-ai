import { seedKnowledgeBase } from "@/lib/seed/runSeed";

async function seed(): Promise<void> {
  const result = await seedKnowledgeBase();
  console.log(`Seeded ${result.articleCount} articles and ${result.chunkCount} chunks.`);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
