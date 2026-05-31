import { NextResponse } from "next/server";

import { getStoreBackend, getStoreWarnings } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const warnings = getStoreWarnings();
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

  return NextResponse.json({
    ok: true,
    ready: warnings.length === 0,
    backend: getStoreBackend(),
    ai: {
      hasOpenAIKey,
      chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    },
    warnings,
    timestamp: new Date().toISOString(),
  });
}
