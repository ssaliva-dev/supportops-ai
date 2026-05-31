import { NextResponse } from "next/server";

import { getStoreBackend } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    backend: getStoreBackend(),
    timestamp: new Date().toISOString(),
  });
}
