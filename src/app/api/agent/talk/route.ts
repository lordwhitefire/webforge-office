import { NextRequest, NextResponse } from "next/server";
import { talkToAgent } from "@/lib/webforge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    const result = await talkToAgent(agent, message);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Agent script failed", reply: "" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      agent,
      reply: result.reply,
      raw: result.raw,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
