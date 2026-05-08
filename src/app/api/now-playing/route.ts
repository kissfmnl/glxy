import { NextResponse } from "next/server";
import { getNowPlaying, type GetNowPlayingResult } from "@/app/actions/nowPlayingActions";
import { getAlbumCover } from "@/app/actions/albumActions";
import { prisma } from "@/lib/prisma";
import { isBlockedFeedItem, isGarbageNext, isMeaningfulText } from "@/lib/nowPlayingGuards";
import { recordNewPlayedTrack } from "@/lib/playedTrackLogger";

export const dynamic = "force-dynamic";

type NowPlayingPayload = {
  success: true;
  current: { title: string; artist: string; startTime?: string; duration?: number };
  next: { title: string; artist: string };
  updated?: string;
  cover: string | null;
};

type SuccessNowPlaying = Extract<GetNowPlayingResult, { success: true }>;

let lastGood: NowPlayingPayload | null = null;
let pendingTrackKey: string | null = null;
let pendingTrackStartedAt = 0;
let effectiveTrackKey: string | null = null;
/** Laatste geldige “straks”-track; feed stuurt soms dummy — dan niet overschrijven. */
let lastValidNext: { title: string; artist: string } | null = null;

function applyNextToPayload(payload: NowPlayingPayload) {
  if (!isGarbageNext(payload.next)) {
    lastValidNext = { title: payload.next.title, artist: payload.next.artist };
  }
  payload.next = lastValidNext
    ? { ...lastValidNext }
    : { title: "Straks op KISS FM", artist: "Blijf luisteren" };
}

/** Laatste gelogde track (bij reclame / onbekende metadata). */
async function tryHistoryFallback(result: SuccessNowPlaying): Promise<NowPlayingPayload | null> {
  try {
    const fromHist = await prisma.playedTrack.findFirst({
      orderBy: { playedAt: "desc" },
      select: { title: true, artist: true, cover: true },
    });
    if (!fromHist) return null;
    const title = fromHist.title.trim();
    const artist = fromHist.artist.trim();
    if (!isMeaningfulText(title) || !isMeaningfulText(artist)) return null;
    let histCover = fromHist.cover ?? null;
    if (!histCover) {
      try {
        histCover = await getAlbumCover(artist, title);
      } catch {
        histCover = null;
      }
    }
    const payload = {
      ...result,
      cover: histCover,
      current: {
        ...result.current,
        title,
        artist,
      },
    } as NowPlayingPayload;
    applyNextToPayload(payload);
    return payload;
  } catch {
    return null;
  }
}

async function getNowPlayingDelayMs() {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "NOW_PLAYING_DELAY_SECONDS" },
      select: { value: true },
    });
    const seconds = row ? Number(row.value) : 30;
    const safe = Number.isFinite(seconds) ? Math.min(Math.max(Math.round(seconds), 0), 300) : 30;
    return safe * 1000;
  } catch {
    return 30_000;
  }
}

export async function GET() {
  const delayMs = await getNowPlayingDelayMs();
  const result = await getNowPlaying();
  if (!result.success) {
    if (lastGood) return NextResponse.json(lastGood);
    return NextResponse.json(result, { status: 502 });
  }

  let cover: string | null = null;
  try {
    if (result.current?.artist && result.current?.title) {
      cover = await getAlbumCover(result.current.artist, result.current.title);
    }
  } catch {
    cover = null;
  }

  const payload: NowPlayingPayload = {
    ...result,
    cover,
  } as any;

  if (isBlockedFeedItem(payload.current?.title, payload.current?.artist)) {
    if (lastGood) return NextResponse.json(lastGood);
    const fromHist = await tryHistoryFallback(result);
    if (fromHist) {
      lastGood = fromHist;
      return NextResponse.json(fromHist);
    }
  }

  // Onbekend / reclame / talk: eerst cache, dan playlist-log, nooit "Onbekend" tonen.
  if (!isMeaningfulText(payload.current?.title) || !isMeaningfulText(payload.current?.artist)) {
    if (lastGood) return NextResponse.json(lastGood);
    const fromHist = await tryHistoryFallback(result);
    if (fromHist) {
      lastGood = fromHist;
      return NextResponse.json(fromHist);
    }
    payload.current.title = isMeaningfulText(payload.current?.title)
      ? String(payload.current.title).trim()
      : "KISS FM";
    payload.current.artist = isMeaningfulText(payload.current?.artist)
      ? String(payload.current.artist).trim()
      : "Live op de radio";
    applyNextToPayload(payload);
    lastGood = payload;
    return NextResponse.json(payload);
  }

  if (!isGarbageNext(payload.next)) {
    lastValidNext = { title: payload.next.title, artist: payload.next.artist };
  }
  payload.next = lastValidNext
    ? { ...lastValidNext }
    : { title: "Straks op KISS FM", artist: "Blijf luisteren" };

  const currentKey = `${payload.current.artist}—${payload.current.title}`;
  const now = Date.now();

  // Delay track switches to better sync metadata with audible stream.
  if (!effectiveTrackKey) {
    effectiveTrackKey = currentKey;
    pendingTrackKey = null;
    pendingTrackStartedAt = 0;
    lastGood = payload;
  } else if (currentKey !== effectiveTrackKey) {
    if (pendingTrackKey !== currentKey) {
      pendingTrackKey = currentKey;
      pendingTrackStartedAt = now;
    }
    const elapsed = now - pendingTrackStartedAt;
    if (elapsed < delayMs && lastGood) {
      return NextResponse.json(lastGood);
    }
    effectiveTrackKey = currentKey;
    pendingTrackKey = null;
    pendingTrackStartedAt = 0;
    lastGood = payload;
  } else {
    pendingTrackKey = null;
    pendingTrackStartedAt = 0;
    lastGood = payload;
  }

  // Playlist-log (ook periodiek via /api/cron/playlist-log zodat dit zonder siteverkeer doorloopt).
  try {
    await recordNewPlayedTrack(payload.current.artist, payload.current.title, payload.cover ?? null);
  } catch {
    // ignore logging errors (playlist is non-critical)
  }

  return NextResponse.json(payload);
}
