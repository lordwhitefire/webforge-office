import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = readFileSync(join(process.cwd(), "src/lib/agent-runtime/agents.json"), "utf-8");
    const parsed = JSON.parse(data);
    const agents = parsed.agents.map((a: any) => ({
      name: a.name,
      department: a.department,
      role: a.title,
    }));
    return NextResponse.json({ ok: true, agents });
  } catch (e) {
    return NextResponse.json({ ok: false, agents: [], error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
