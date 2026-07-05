import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent-runtime/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/agent/talk
 * Legacy endpoint — now redirects to the new agent runtime.
 * Body: { agent: string, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const agent = (body?.agent ?? "").toString().trim();
    const message = (body?.message ?? "").toString().trim();

    if (!agent || !message) {
      return NextResponse.json({ ok: false, error: "Missing 'agent' or 'message'" }, { status: 400 });
    }

    const result = await runAgent({ agentName: agent, message, maxSteps: 5 });
    console.log(`[API] /api/agent/talk: ${agent} completed — ${result.steps} steps`);

    return NextResponse.json({
      ok: true,
      agent,
      reply: result.text,
    });
  } catch (e) {
    console.error(`[API] /api/agent/talk: error:`, e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
