import { buildGlxyStationsFromDb, resolveStationNowPlayingUrl } from "@/lib/glxyStations";
import { prisma } from "@/lib/prisma";
import { appendStationPlayHistory } from "@/lib/stationPlayHistory";
import { fetchNowPlayingFromRemoteUrl, isAllowedNowPlayingUrl } from "@/lib/stationNowPlayingFetch";
import { mergeNpWordFilter, processNowPlayingMetadata } from "@/lib/npWordFilter";
import { persistNpSnapshotMerge } from "@/lib/stationNpSnapshotMerge";

const MAX_IDS = 12;

/** Haalt nu-speelt op, werkt snapshot bij en schrijft geschiedenis (dedup in append). */
export async function executeNowPlayingBatch(ids: string[]): Promise<
  Record<string, { title: string; artist: string; coverUrl: string | null }>
> {
  const sliced = Array.from(new Set(ids.map((s) => s.trim()).filter(Boolean))).slice(0, MAX_IDS);
  const byId: Record<string, { title: string; artist: string; coverUrl: string | null }> = {};

  if (sliced.length === 0) return byId;

  let stationsConfig: unknown = null;
  let npFilter = mergeNpWordFilter(null);
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true, npWordFilter: true } });
    stationsConfig = row?.stationsConfig ?? null;
    npFilter = mergeNpWordFilter(row?.npWordFilter ?? null);
  } catch {
    return byId;
  }

  const stations = buildGlxyStationsFromDb(stationsConfig);
  const snapshotUpdates: Record<string, { title: string; artist: string; coverUrl: string | null }> = {};
  const historyRows: Array<{ id: string; title: string; artist: string; coverUrl: string | null }> = [];

  await Promise.all(
    sliced.map(async (id) => {
      const resolvedNpUrl = resolveStationNowPlayingUrl(stationsConfig, id);
      const station = stations.find((s) => s.id === id);
      const rawUrl = (resolvedNpUrl ?? station?.nowPlayingUrl)?.trim();
      if (!rawUrl || !isAllowedNowPlayingUrl(rawUrl)) {
        byId[id] = { title: "", artist: "", coverUrl: null };
        return;
      }
      const fetched = await fetchNowPlayingFromRemoteUrl(rawUrl);
      const live = processNowPlayingMetadata(fetched.title, fetched.artist, npFilter);
      byId[id] = { title: live.title, artist: live.artist, coverUrl: fetched.coverUrl };
      if (live.title.trim() || live.artist.trim()) {
        snapshotUpdates[id] = { title: live.title, artist: live.artist, coverUrl: fetched.coverUrl };
      }
      if (live.title.trim() || live.artist.trim()) {
        historyRows.push({ id, title: live.title, artist: live.artist, coverUrl: fetched.coverUrl });
      }
    }),
  );

  await persistNpSnapshotMerge(snapshotUpdates);
  for (const row of historyRows) {
    appendStationPlayHistory(row.id, row.title, row.artist, row.coverUrl);
  }

  return byId;
}
