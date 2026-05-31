import { NextResponse } from "next/server";

import { runStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const escalations = await runStore.listEscalations();
  return NextResponse.json({ escalations });
}
