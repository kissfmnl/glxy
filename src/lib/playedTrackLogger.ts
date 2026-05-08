import { prisma } from "@/lib/prisma";
import { trackKeyNorm } from "@/lib/trackNormalization";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Voegt een regel toe als het genormaliseerde nummer anders is dan de laatste in de DB.
 * Gebruikt door /api/now-playing (bezoekers) en /api/cron/playlist-log (elke minuut).
 */
export async function recordNewPlayedTrack(artist: string, title: string, cover: string | null) {
  const curKey = trackKeyNorm(artist, title);
  await prisma.$transaction(async (tx) => {
    const latest = await tx.playedTrack.findFirst({
      orderBy: { playedAt: "desc" },
      select: { artist: true, title: true },
    });
    const lastKey = latest ? trackKeyNorm(latest.artist, latest.title) : null;
    if (lastKey === curKey) return;
    await tx.playedTrack.create({
      data: { artist, title, cover },
    });
  });
}

/** Verwijdert alles ouder dan 7 dagen zodat de playlistlogger maximaal een week terug gaat. */
export async function prunePlayedTracksOlderThanWeek() {
  const cutoff = new Date(Date.now() - RETENTION_MS);
  await prisma.playedTrack.deleteMany({
    where: { playedAt: { lt: cutoff } },
  });
}
