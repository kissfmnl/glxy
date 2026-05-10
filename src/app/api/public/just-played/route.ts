import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb } from "@/lib/glxyStations";
import { applyNpWordFilter, mergeNpWordFilter, phraseListEverywhere } from "@/lib/npWordFilter";
import type { StationPlayEntry } from "@/lib/stationPlayHistory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

function scrubEntry(e: StationPlayEntry, phrases: string[]): StationPlayEntry {
  if (phrases.length === 0) return e;
  const { title, artist } = applyNpWordFilter(e.title, e.artist, phrases);
  return { ...e, title, artist };
}

export async function GET() {
  try {
    const row = await prisma.branding.findUnique({
      where: { id: 1 },
      select: { stationPlayHistory: true, stationsConfig: true, npWordFilter: true },
    });
    const phrases = phraseListEverywhere(mergeNpWordFilter(row?.npWordFilter ?? null));
    const stations = buildGlxyStationsFromDb(row?.stationsConfig ?? null);
    const stationOptions = stations.map((s) => ({ id: s.id, label: s.line1 }));

    const rawHist = row?.stationPlayHistory;
    const byStation: Record<string, StationPlayEntry[]> = {};
    if (rawHist && typeof rawHist === "object" && !Array.isArray(rawHist)) {
      for (const [k, v] of Object.entries(rawHist)) {
        if (Array.isArray(v)) {
          byStation[k] = v.filter(isEntry).slice(0, 50).map((e) => scrubEntry(e, phrases));
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
