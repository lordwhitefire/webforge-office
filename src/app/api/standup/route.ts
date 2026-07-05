import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, output: "Standup is now handled by the agent runtime. Ask Hermes to run a standup via /api/agent/run." });
}
