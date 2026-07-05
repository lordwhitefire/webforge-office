import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/agent/hierarchy
 * Returns the full agent hierarchy from agents.json.
 * Used by the AgentTree component to render all 285 agents.
 */
export async function GET() {
  try {
    // Load agents.json
    const paths = [
      join(process.cwd(), "src/lib/agent-runtime/agents.json"),
      join(__dirname, "agents.json"),
    ];

    let data: string | null = null;
    for (const p of paths) {
      try {
        data = readFileSync(p, "utf-8");
        break;
      } catch {}
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "agents.json not found", hierarchy: {} },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(data);
    const agents = parsed.agents as Array<{
      name: string;
      title: string;
      department: string;
      roleTier: string;
      reportsTo: string | null;
      subordinates: string[];
    }>;

    // Build hierarchy map: name → { name, title, department, roleTier, subordinates }
    const hierarchy: Record<string, {
      name: string;
      title: string;
      department: string;
      roleTier: string;
      subordinates: string[];
    }> = {};

    for (const a of agents) {
      hierarchy[a.name] = {
        name: a.name,
        title: a.title,
        department: a.department,
        roleTier: a.roleTier,
        subordinates: a.subordinates || [],
      };
    }

    return NextResponse.json({
      ok: true,
      hierarchy,
      count: Object.keys(hierarchy).length,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error", hierarchy: {} },
      { status: 500 }
    );
  }
}
