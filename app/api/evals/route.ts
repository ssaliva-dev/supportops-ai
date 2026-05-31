import { NextResponse } from "next/server";

import { runEvalSuite } from "@/lib/evals/runner";
import { knowledgeStore } from "@/lib/store";
import { seedKnowledgeBase } from "@/lib/seed/runSeed";

export const runtime = "nodejs";

export async function POST() {
  try {
    const articles = await knowledgeStore.listArticles();
    if (articles.length === 0) {
      await seedKnowledgeBase();
    }

    const evalRun = await runEvalSuite();
    return NextResponse.json(evalRun);
  } catch (error) {
    return NextResponse.json({ error: "Failed to run evals.", detail: (error as Error).message }, { status: 500 });
  }
}
