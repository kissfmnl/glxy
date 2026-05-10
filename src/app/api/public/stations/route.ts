import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb } from "@/lib/glxyStations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let stationsConfig: unknown = null;
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true } });
    stationsConfig = row?.stationsConfig ?? null;
  } catch {
    /* offline */
  }
  const stations = buildGlxyStationsFromDb(stationsConfig);
  return NextResponse.json({ stations });
}
