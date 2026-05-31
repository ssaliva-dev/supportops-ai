import { NextResponse } from "next/server";

import { runStore } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const notes = typeof body?.notes === "string" ? body.notes : undefined;

    await runStore.resolveEscalation(id, notes);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to resolve escalation.", detail: (error as Error).message }, { status: 500 });
  }
}
