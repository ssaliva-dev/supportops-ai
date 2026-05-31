import { NextResponse } from "next/server";

import { getStoreBackend, getStoreWarnings } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const warnings = getStoreWarnings();

  return NextResponse.json({
    ok: true,
    ready: warnings.length === 0,
    backend: getStoreBackend(),
    warnings,
    timestamp: new Date().toISOString(),
  });
}
