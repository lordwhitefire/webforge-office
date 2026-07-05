import { NextResponse } from "next/server";
import { runStandup } from "@/lib/webforge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await runStandup();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error", output: "" },
      { status: 500 }
    );
  }
}
