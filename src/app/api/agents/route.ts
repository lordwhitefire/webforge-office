import { NextResponse } from "next/server";
import { listAgents } from "@/lib/webforge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { agents, error } = await listAgents();
    if (error) {
      return NextResponse.json({ ok: false, error, agents: [] }, { status: 500 });
    }
    return NextResponse.json({ ok: true, agents });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error", agents: [] },
      { status: 500 }
    );
  }
}
