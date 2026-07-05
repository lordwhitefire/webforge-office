import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const runs = await prisma.run.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
    return NextResponse.json({ ok: true, runs });
  } catch (e) {
    return NextResponse.json({ ok: false, runs: [], error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
