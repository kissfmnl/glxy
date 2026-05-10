import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb } from "@/lib/glxyStations";
import { prisma } from "@/lib/prisma";
import { executeNowPlayingBatch } from "@/lib/stationNowPlayingBatch";

export const dynamic = "force-dynamic";

/** Minuut-cron (vercel.json): houdt Just played bij zonder bezoekers op de site. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true } });
    const stations = buildGlxyStationsFromDb(row?.stationsConfig ?? null);
    const ids = stations.map((s) => s.id);
    await executeNowPlayingBatch(ids);
    return NextResponse.json({ ok: true, stations: ids.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
