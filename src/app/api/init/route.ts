import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ ok: true, reaped: { orphaned: [], resumed: [], failed: [], total: 0 } });
}
