import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb, resolveStationNowPlayingUrl } from "@/lib/glxyStations";
import { prisma } from "@/lib/prisma";
import { appendStationPlayHistory } from "@/lib/stationPlayHistory";
import { fetchNowPlayingFromRemoteUrl, isAllowedNowPlayingUrl } from "@/lib/stationNowPlayingFetch";
import { applyNpWordFilter, mergeNpWordFilter } from "@/lib/npWordFilter";
import { persistNpSnapshotMerge } from "@/lib/stationNpSnapshotMerge";

export const dynamic = "force-dynamic";

const MAX_IDS = 12;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = Array.from(new Set(raw.split(/[,+\s]+/).map((s) => s.trim()).filter(Boolean))).slice(0, MAX_IDS);
  if (ids.length === 0) {
    return NextResponse.json({ byId: {} }, { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } });
  }

  let stationsConfig: unknown = null;
  let npPhrases: string[] = [];
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true, npWordFilter: true } });
    stationsConfig = row?.stationsConfig ?? null;
    npPhrases = mergeNpWordFilter(row?.npWordFilter ?? null).phrases;
  } catch {
    return NextResponse.json({ byId: {} });
  }

  const stations = buildGlxyStationsFromDb(stationsConfig);
  const byId: Record<string, { title: string; artist: string; coverUrl: string | null }> = {};
  const updates: Record<string, { title: string; artist: string; coverUrl: string | null }> = {};

  await Promise.all(
    ids.map(async (id) => {
      const rawNp = resolveStationNowPlayingUrl(stationsConfig, id);
      const station = stations.find((s) => s.id === id);
      const rawUrl = (rawNp ?? station?.nowPlayingUrl)?.trim();
      if (!rawUrl || !isAllowedNowPlayingUrl(rawUrl)) {
        byId[id] = { title: "", artist: "", coverUrl: null };
        return;
      }
      let { title, artist, coverUrl } = await fetchNowPlayingFromRemoteUrl(rawUrl);
      if (npPhrases.length > 0) {
        ({ title, artist } = applyNpWordFilter(title, artist, npPhrases));
      }
      byId[id] = { title, artist, coverUrl };
      if (title.trim() || artist.trim()) {
        updates[id] = { title, artist, coverUrl };
      }
    }),
  );

  await persistNpSnapshotMerge(updates);
  for (const [id, { title, artist, coverUrl }] of Object.entries(updates)) {
    appendStationPlayHistory(id, title, artist, coverUrl);
  }

  return NextResponse.json(
    { byId },
    { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } },
  );
}
