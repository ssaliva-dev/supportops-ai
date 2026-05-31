import { MODEL_CONFIG } from "@/lib/config";
import { getOpenAIClient } from "@/lib/ai/openai";

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (texts.length === 0) {
    return [];
  }

  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  const response = await client.embeddings.create({
    model: MODEL_CONFIG.embeddingModel,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
