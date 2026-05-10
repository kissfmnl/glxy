import { NextResponse } from "next/server";
import { executeNowPlayingBatch } from "@/lib/stationNowPlayingBatch";

export const dynamic = "force-dynamic";

const MAX_IDS = 12;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = Array.from(new Set(raw.split(/[,+\s]+/).map((s) => s.trim()).filter(Boolean))).slice(0, MAX_IDS);
  if (ids.length === 0) {
    return NextResponse.json({ byId: {} }, { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } });
  }

  const byId = await executeNowPlayingBatch(ids);

  return NextResponse.json(
    { byId },
    { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } },
  );
}
