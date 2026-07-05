import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent-runtime/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/agent/run
 * Body: { agent: string, message: string }
 *
 * Runs the agent runtime loop — the LLM thinks, calls tools, loops.
 * This is the real agent engine (not the old Python regex parser).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const agent = (body?.agent ?? "").toString().trim();
    const message = (body?.message ?? "").toString().trim();

    if (!agent || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing 'agent' or 'message' field" },
        { status: 400 }
      );
    }

    console.log(`[API] /api/agent/run: agent=${agent}, message=${message.slice(0, 80)}...`);

    const result = await runAgent({
      agentName: agent,
      message,
      maxSteps: 5,
    });

    return NextResponse.json({
      ok: true,
      agent,
      reply: result.text,
      toolCalls: result.toolCalls,
      model: result.model,
      steps: result.steps,
    });
  } catch (e) {
    console.error("[API] /api/agent/run error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
