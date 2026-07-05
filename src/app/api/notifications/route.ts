import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      where: { status: "unread" },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ ok: true, notifications: messages });
  } catch (e) {
    return NextResponse.json({ ok: false, notifications: [], error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
