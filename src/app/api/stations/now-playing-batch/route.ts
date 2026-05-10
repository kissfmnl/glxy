import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb, resolveStationNowPlayingUrl } from "@/lib/glxyStations";
import { prisma } from "@/lib/prisma";
import { appendStationPlayHistory } from "@/lib/stationPlayHistory";
import { fetchNowPlayingFromRemoteUrl, isAllowedNowPlayingUrl } from "@/lib/stationNowPlayingFetch";
import { applyNpWordFilter, mergeNpWordFilter, phraseListEverywhere, phraseListForLiveNp } from "@/lib/npWordFilter";
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
  let phrasesLive: string[] = [];
  let phrasesHistory: string[] = [];
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true, npWordFilter: true } });
    stationsConfig = row?.stationsConfig ?? null;
    const f = mergeNpWordFilter(row?.npWordFilter ?? null);
    phrasesLive = phraseListForLiveNp(f);
    phrasesHistory = phraseListEverywhere(f);
  } catch {
    return NextResponse.json({ byId: {} });
  }

  const stations = buildGlxyStationsFromDb(stationsConfig);
  const byId: Record<string, { title: string; artist: string; coverUrl: string | null }> = {};
  const snapshotUpdates: Record<string, { title: string; artist: string; coverUrl: string | null }> = {};
  const historyRows: Array<{ id: string; title: string; artist: string; coverUrl: string | null }> = [];

  await Promise.all(
    ids.map(async (id) => {
      const resolvedNpUrl = resolveStationNowPlayingUrl(stationsConfig, id);
      const station = stations.find((s) => s.id === id);
      const rawUrl = (resolvedNpUrl ?? station?.nowPlayingUrl)?.trim();
      if (!rawUrl || !isAllowedNowPlayingUrl(rawUrl)) {
        byId[id] = { title: "", artist: "", coverUrl: null };
        return;
      }
      const fetched = await fetchNowPlayingFromRemoteUrl(rawUrl);
      const live =
        phrasesLive.length > 0 ? applyNpWordFilter(fetched.title, fetched.artist, phrasesLive) : fetched;
      const hist =
        phrasesHistory.length > 0 ? applyNpWordFilter(fetched.title, fetched.artist, phrasesHistory) : fetched;
      byId[id] = { title: live.title, artist: live.artist, coverUrl: fetched.coverUrl };
      if (live.title.trim() || live.artist.trim()) {
        snapshotUpdates[id] = { title: live.title, artist: live.artist, coverUrl: fetched.coverUrl };
      }
      if (hist.title.trim() || hist.artist.trim()) {
        historyRows.push({ id, title: hist.title, artist: hist.artist, coverUrl: fetched.coverUrl });
      }
    }),
  );

  await persistNpSnapshotMerge(snapshotUpdates);
  for (const row of historyRows) {
    appendStationPlayHistory(row.id, row.title, row.artist, row.coverUrl);
  }

  return NextResponse.json(
    { byId },
    { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } },
  );
}
