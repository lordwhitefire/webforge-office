import { NextResponse } from "next/server";
import { getAgentStates } from "@/lib/agent-runtime/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/agent/states
 * Returns real-time agent states for the UI.
 * Poll this every 2-3 seconds to see the agent tree update.
 */
export async function GET() {
  try {
    const states = await getAgentStates();
    return NextResponse.json({ ok: true, states });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error", states: {} },
      { status: 500 }
    );
  }
}
