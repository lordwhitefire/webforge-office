import { NextRequest, NextResponse } from "next/server";
import { getRuns } from "@/lib/webforge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") ?? "all";
    const { ok, runs, error } = await getRuns(status);
    if (!ok) {
      return NextResponse.json({ ok: false, error, runs: [] }, { status: 500 });
    }
    return NextResponse.json({ ok: true, runs });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error", runs: [] },
      { status: 500 }
    );
  }
}
