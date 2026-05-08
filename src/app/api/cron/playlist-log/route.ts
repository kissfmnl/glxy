import { NextResponse } from "next/server";
import { getNowPlaying } from "@/app/actions/nowPlayingActions";
import { getAlbumCover } from "@/app/actions/albumActions";
import { isBlockedFeedItem, isMeaningfulText } from "@/lib/nowPlayingGuards";
import { prunePlayedTracksOlderThanWeek, recordNewPlayedTrack } from "@/lib/playedTrackLogger";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron (zie vercel.json): elke minuut feed lezen, playlist bijwerken, data >7 dagen wissen.
 * Zet CRON_SECRET in de omgeving; Vercel stuurt Authorization: Bearer <CRON_SECRET>.
 * Zonder Vercel: zelfde URL periodiek aanroepen met die header (bijv. systemd timer of GitHub Actions).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getNowPlaying();
    if (!result.success) {
      await prunePlayedTracksOlderThanWeek();
      return NextResponse.json({ ok: true, feed: "down" });
    }

    const cur = result.current;
    if (
      isBlockedFeedItem(cur?.title, cur?.artist) ||
      !isMeaningfulText(cur?.title) ||
      !isMeaningfulText(cur?.artist)
    ) {
      await prunePlayedTracksOlderThanWeek();
      return NextResponse.json({ ok: true, skipped: "metadata" });
    }

    let cover: string | null = null;
    try {
      cover = await getAlbumCover(cur.artist, cur.title);
    } catch {
      cover = null;
    }

    await recordNewPlayedTrack(cur.artist, cur.title, cover);
    await prunePlayedTracksOlderThanWeek();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cron/playlist-log]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
