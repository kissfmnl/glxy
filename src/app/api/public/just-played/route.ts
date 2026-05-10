import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb } from "@/lib/glxyStations";
import {
  applyNpWordFilter,
  hideFullPhrases,
  matchesHideFull,
  mergeNpWordFilter,
  stripPhrases,
} from "@/lib/npWordFilter";
import type { StationPlayEntry } from "@/lib/stationPlayHistory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_TRACKS_PER_STATION = 10;

function isEntry(x: unknown): x is StationPlayEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.artist === "string" &&
    typeof o.playedAt === "string"
  );
}

function scrubEntry(e: StationPlayEntry, hidePhrases: string[], stripPs: string[]): StationPlayEntry | null {
  if (matchesHideFull(e.title, e.artist, hidePhrases)) return null;
  if (stripPs.length === 0) return e;
  const { title, artist } = applyNpWordFilter(e.title, e.artist, stripPs);
  return { ...e, title, artist };
}

export async function GET() {
  try {
    const row = await prisma.branding.findUnique({
      where: { id: 1 },
      select: { stationPlayHistory: true, stationsConfig: true, npWordFilter: true },
    });
    const f = mergeNpWordFilter(row?.npWordFilter ?? null);
    const hidePhrases = hideFullPhrases(f);
    const stripPs = stripPhrases(f);
    const stations = buildGlxyStationsFromDb(row?.stationsConfig ?? null);
    const stationOptions = stations.map((s) => ({ id: s.id, label: s.line1, logoUrl: s.logoUrl ?? null }));

    const rawHist = row?.stationPlayHistory;
    const byStation: Record<string, StationPlayEntry[]> = {};
    if (rawHist && typeof rawHist === "object" && !Array.isArray(rawHist)) {
      for (const [k, v] of Object.entries(rawHist)) {
        if (Array.isArray(v)) {
          const cleaned = v
            .filter(isEntry)
            .map((e) => scrubEntry(e, hidePhrases, stripPs))
            .filter((x): x is StationPlayEntry => x !== null)
            .slice(0, MAX_TRACKS_PER_STATION);
          byStation[k] = cleaned;
        }
      }
    }

    const merged: (StationPlayEntry & { stationId: string })[] = [];
    for (const s of stations) {
      for (const e of byStation[s.id] ?? []) {
        merged.push({ ...e, stationId: s.id });
      }
    }
    merged.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

    return NextResponse.json(
      { stations: stationOptions, byStation, merged },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } },
    );
  } catch {
    return NextResponse.json({ stations: [], byStation: {}, merged: [] });
  }
}
