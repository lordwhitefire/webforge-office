import { NextRequest, NextResponse } from "next/server";
import { runAgent, getAgentStates } from "@/lib/agent-runtime/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/agent/run
 * Body: { agent: string, message: string }
 *
 * Starts the agent runtime loop IN THE BACKGROUND.
 * Returns immediately with a "started" status.
 * The UI polls /api/agent/states to see real-time progress.
 *
 * The loop runs synchronously internally (delegation pauses parent,
 * runs child, result bubbles back up) — but the HTTP request doesn't
 * block on it.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const agent = (body?.agent ?? "").toString().trim();
    const message = (body?.message ?? "").toString().trim();
    const maxSteps = body?.maxSteps || 8;

    if (!agent || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing 'agent' or 'message' field" },
        { status: 400 }
      );
    }

    console.log(`[API] /api/agent/run: agent=${agent}, message=${message.slice(0, 80)}...`);

    // Start the agent loop IN THE BACKGROUND (fire and forget)
    // The loop runs synchronously internally (delegation pauses parent,
    // runs child, result bubbles back up) — but we don't await it here.
    const runId = `run-${Date.now()}`;

    runAgent({
      agentName: agent,
      message,
      maxSteps,
    }).then((result) => {
      console.log(`[API] Agent ${agent} completed: ${result.steps} steps, ${result.toolCalls.length} tool calls`);
      console.log(`[API] Reply: ${result.text.slice(0, 200)}...`);
    }).catch((e) => {
      console.error(`[API] Agent ${agent} failed:`, e);
    });

    // Return immediately — the UI will poll /api/agent/states for progress
    return NextResponse.json({
      ok: true,
      agent,
      runId,
      message: "Agent loop started in background. Poll /api/agent/states for progress.",
    });
  } catch (e) {
    console.error("[API] /api/agent/run error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/run
 * Returns current agent states (for UI polling).
 */
export async function GET() {
  try {
    const states = await getAgentStates();
    return NextResponse.json({ ok: true, states });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
