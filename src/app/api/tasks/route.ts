import { NextResponse } from "next/server";
import { getTasks } from "@/lib/webforge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { ok, tasks, error } = await getTasks();
    if (!ok) {
      return NextResponse.json({ ok: false, error, tasks: [] }, { status: 500 });
    }
    return NextResponse.json({ ok: true, tasks });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error", tasks: [] },
      { status: 500 }
    );
  }
}
