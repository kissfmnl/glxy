import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb, resolveStationNowPlayingUrl } from "@/lib/glxyStations";
import { prisma } from "@/lib/prisma";
import { appendStationPlayHistory } from "@/lib/stationPlayHistory";
import { fetchNowPlayingFromRemoteUrl, isAllowedNowPlayingUrl } from "@/lib/stationNowPlayingFetch";
import { applyNpWordFilter, mergeNpWordFilter } from "@/lib/npWordFilter";
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
  let npPhrases: string[] = [];
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true, npWordFilter: true } });
    stationsConfig = row?.stationsConfig ?? null;
    npPhrases = mergeNpWordFilter(row?.npWordFilter ?? null).phrases;
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

  let { title: t, artist: a, coverUrl } = await fetchNowPlayingFromRemoteUrl(rawUrl);
  if (npPhrases.length > 0) {
    ({ title: t, artist: a } = applyNpWordFilter(t, a, npPhrases));
  }
  const text = [a, t].filter(Boolean).join(" — ").slice(0, 320);
  persistNpSnapshot(id, t, a, coverUrl);
  appendStationPlayHistory(id, t, a, coverUrl);
  return NextResponse.json(
    { title: t, artist: a, text },
    { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } },
  );
}
