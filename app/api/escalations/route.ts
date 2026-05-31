import { NextResponse } from "next/server";

import { runStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const escalations = await runStore.listEscalations();
    return NextResponse.json({ escalations });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load escalations.", detail: (error as Error).message },
      { status: 500 },
    );
  }
}
