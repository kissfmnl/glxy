import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { formatAmsterdamYMD, playlistHistoryMinYMD } from "@/lib/amsterdamClock";
import { prisma } from "@/lib/prisma";
import { trackKeyNorm } from "@/lib/trackNormalization";

export const dynamic = "force-dynamic";

/** Na tijd aflopend: twee dezelfde nummers direct onder elkaar → één regel (nieuwste tijd behouden). */
function collapseConsecutiveDuplicates<T extends { artist: string; title: string }>(rows: T[], maxOut: number): T[] {
  const out: T[] = [];
  let prevKey: string | null = null;
  for (const row of rows) {
    const k = trackKeyNorm(row.artist, row.title);
    if (prevKey !== null && k === prevKey) continue;
    out.push(row);
    prevKey = k;
    if (out.length >= maxOut) break;
  }
  return out;
}

function isValidYMD(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function slotToHours(slot: string): { fromH: number; toH: number } {
  switch (slot) {
    case "morning":
      return { fromH: 6, toH: 12 };
    case "afternoon":
      return { fromH: 12, toH: 18 };
    case "evening":
      return { fromH: 18, toH: 24 };
    default:
      return { fromH: 0, toH: 24 };
  }
}

/** Eén uur in Europe/Amsterdam (0–23), of null voor hele dag / onbekend. */
function parseHourParam(raw: string | null): number | null {
  if (raw == null) return null;
  const s = raw.trim().toLowerCase();
  if (s === "" || s === "all") return null;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0 || n > 23) return null;
  return n;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 80), 1), 200);
    const dateStr = (url.searchParams.get("date") || "").trim();
    const slot = (url.searchParams.get("slot") || "all").trim().toLowerCase();
    const hourOne = parseHourParam(url.searchParams.get("hour"));
    let fromH: number;
    let toH: number;
    if (hourOne !== null) {
      fromH = hourOne;
      toH = hourOne === 23 ? 24 : hourOne + 1;
    } else {
      const r = slotToHours(slot === "all" ? "all" : slot);
      fromH = r.fromH;
      toH = r.toH;
    }

    if (isValidYMD(dateStr)) {
      const minD = playlistHistoryMinYMD(7);
      const maxD = formatAmsterdamYMD();
      const day =
        dateStr < minD ? minD : dateStr > maxD ? maxD : dateStr;
      const take = Math.min(Math.max(limit * 8, 120), 600);
      let raw: { id: string; title: string; artist: string; cover: string | null; playedAt: Date }[];

      if (fromH === 0 && toH === 24) {
        raw = await prisma.$queryRaw<
          { id: string; title: string; artist: string; cover: string | null; playedAt: Date }[]
        >(Prisma.sql`
          SELECT id, title, artist, cover, "playedAt"
          FROM played_tracks
          WHERE "playedAt" >= (${day}::date AT TIME ZONE 'Europe/Amsterdam')
            AND "playedAt" < ((${day}::date + interval '1 day') AT TIME ZONE 'Europe/Amsterdam')
          ORDER BY "playedAt" DESC
          LIMIT ${take}
        `);
      } else {
        raw = await prisma.$queryRaw<
          { id: string; title: string; artist: string; cover: string | null; playedAt: Date }[]
        >(Prisma.sql`
          SELECT id, title, artist, cover, "playedAt"
          FROM played_tracks
          WHERE "playedAt" >= ((${day}::date + ${fromH} * interval '1 hour') AT TIME ZONE 'Europe/Amsterdam')
            AND "playedAt" < ((${day}::date + ${toH} * interval '1 hour') AT TIME ZONE 'Europe/Amsterdam')
          ORDER BY "playedAt" DESC
          LIMIT ${take}
        `);
      }

      const tracks = collapseConsecutiveDuplicates(raw, limit).map((row) => ({
        ...row,
        playedAt: row.playedAt instanceof Date ? row.playedAt.toISOString() : row.playedAt,
      }));
      return NextResponse.json({ success: true, tracks });
    }

    const fetchCap = Math.min(limit * 6, 400);
    const legacy = await prisma.playedTrack.findMany({
      orderBy: { playedAt: "desc" },
      take: fetchCap,
    });
    const tracks = collapseConsecutiveDuplicates(legacy, limit);
    return NextResponse.json({ success: true, tracks });
  } catch {
    return NextResponse.json({ success: false, tracks: [] }, { status: 200 });
  }
}
