import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/webforge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { ok, notifications, error } = await getNotifications();
    if (!ok) {
      return NextResponse.json({ ok: false, error, notifications: [] }, { status: 500 });
    }
    return NextResponse.json({ ok: true, notifications });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error", notifications: [] },
      { status: 500 }
    );
  }
}
