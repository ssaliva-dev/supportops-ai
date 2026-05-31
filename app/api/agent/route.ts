import { NextResponse } from "next/server";

import { runSupportAgent } from "@/lib/ai/agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = typeof body?.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const result = await runSupportAgent(question);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run support agent.", detail: (error as Error).message },
      { status: 500 },
    );
  }
}
