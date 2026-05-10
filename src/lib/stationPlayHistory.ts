import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const MAX_PER_STATION = 50;

export type StationPlayEntry = {
  id: string;
  title: string;
  artist: string;
  playedAt: string;
  coverUrl?: string | null;
};

function sameTrack(a: { title: string; artist: string }, b: { title: string; artist: string }) {
  return (
    a.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
    a.artist.trim().toLowerCase() === b.artist.trim().toLowerCase()
  );
}

/**
 * Wanneer metadata verandert: opslaan in play history (dedup t.o.v. vorige logregel per zender).
 * Fire-and-forget vriendelijk: async, errors slikken.
 */
export function appendStationPlayHistory(
  stationId: string,
  title: string,
  artist: string,
  coverUrl?: string | null,
): void {
  const t = title.trim();
  const a = artist.trim();
  if (!t && !a) return;
  const cover = typeof coverUrl === "string" && /^https?:\/\//i.test(coverUrl.trim()) ? coverUrl.trim().slice(0, 2000) : null;

  void (async () => {
    try {
      const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationPlayHistory: true } });
      const raw = row?.stationPlayHistory;
      const prev: Record<string, unknown> =
        raw && typeof raw === "object" && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
      const listRaw = prev[stationId];
      const list: StationPlayEntry[] = Array.isArray(listRaw)
        ? (listRaw as unknown[]).filter((x): x is StationPlayEntry => isEntry(x))
        : [];
      const first = list[0];
      if (first && sameTrack(first, { title: t, artist: a })) return;

      const entry: StationPlayEntry = {
        id: randomUUID(),
        title: t,
        artist: a,
        playedAt: new Date().toISOString(),
        ...(cover ? { coverUrl: cover } : {}),
      };
      const next = [entry, ...list].slice(0, MAX_PER_STATION);
      prev[stationId] = next;
      await prisma.branding.update({
        where: { id: 1 },
        data: { stationPlayHistory: prev as object },
      });
    } catch {
      /* geen DB */
    }
  })();
}

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
