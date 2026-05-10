import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb, resolveStationNowPlayingUrl } from "@/lib/glxyStations";
import { prisma } from "@/lib/prisma";
import { appendStationPlayHistory } from "@/lib/stationPlayHistory";
import { fetchNowPlayingFromRemoteUrl, isAllowedNowPlayingUrl } from "@/lib/stationNowPlayingFetch";
import { persistNpSnapshotMerge } from "@/lib/stationNpSnapshotMerge";

export const dynamic = "force-dynamic";

function persistNpSnapshot(id: string, title: string, artist: string, coverUrl: string | null) {
  if (!title.trim() && !artist.trim()) return;
  void persistNpSnapshotMerge({ [id]: { title, artist, coverUrl } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ title: "", artist: "", text: "" });
  }

  let stationsConfig: unknown = null;
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true } });
    stationsConfig = row?.stationsConfig ?? null;
  } catch {
    return NextResponse.json({ title: "", artist: "", text: "" });
  }

  const rawNp = resolveStationNowPlayingUrl(stationsConfig, id);
  const stations = buildGlxyStationsFromDb(stationsConfig);
  const station = stations.find((s) => s.id === id);
  const rawUrl = (rawNp ?? station?.nowPlayingUrl)?.trim();
  if (!rawUrl || !isAllowedNowPlayingUrl(rawUrl)) {
    return NextResponse.json({ title: "", artist: "", text: "" });
  }

  const { title: t, artist: a, coverUrl } = await fetchNowPlayingFromRemoteUrl(rawUrl);
  const text = [a, t].filter(Boolean).join(" — ").slice(0, 320);
  persistNpSnapshot(id, t, a, coverUrl);
  appendStationPlayHistory(id, t, a, coverUrl);
  return NextResponse.json(
    { title: t, artist: a, text },
    { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } },
  );
}
