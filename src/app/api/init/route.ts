import { NextResponse } from "next/server";
import { reapOrphans } from "@/lib/webforge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/init
 * Called by the frontend on startup. Runs the reaper to clean up
 * orphaned runs from previous sessions.
 */
export async function POST() {
  try {
    const result = await reapOrphans(false);
    return NextResponse.json({
      ok: true,
      reaped: result.summary,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
