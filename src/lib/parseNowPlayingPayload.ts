import { parseNowPlayingText } from "@/lib/parseNowPlayingText";

export type ParsedNowPlayingPayload = { title: string; artist: string; coverUrl: string | null };

function pickStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

const COVER_KEYS = [
  "artwork",
  "art",
  "cover",
  "image",
  "imageUrl",
  "imageurl",
  "coverUrl",
  "coverArtUrl",
  "albumarturl",
  "albumArtUrl",
];

function findCoverUrl(o: Record<string, unknown>): string | null {
  for (const k of COVER_KEYS) {
    const v = o[k];
    if (typeof v === "string" && /^https?:\/\//i.test(v.trim())) return v.trim();
  }
  return null;
}

function mergeCover(a: string | null, b: string | null) {
  return a ?? b;
}

function extractFromRecord(o: Record<string, unknown>): ParsedNowPlayingPayload | null {
  let title = pickStr(o.title) ?? pickStr(o.songtitle) ?? pickStr(o.track) ?? pickStr(o.song_name);
  let artist = pickStr(o.artist) ?? pickStr(o.artistName) ?? pickStr(o.artist_name);
  let coverUrl = findCoverUrl(o);

  const nestedKeys = ["now_playing", "nowPlaying", "song", "current", "data", "track", "icestats"];
  for (const nk of nestedKeys) {
    const v = o[nk];
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const inner = v as Record<string, unknown>;
    title = title ?? pickStr(inner.title) ?? pickStr(inner.songtitle) ?? pickStr(inner.track);
    artist = artist ?? pickStr(inner.artist) ?? pickStr(inner.artistName);
    coverUrl = mergeCover(coverUrl, findCoverUrl(inner));
    const song = inner.song;
    if (song && typeof song === "object" && !Array.isArray(song)) {
      const s = song as Record<string, unknown>;
      title = title ?? pickStr(s.title);
      artist = artist ?? pickStr(s.artist);
      coverUrl = mergeCover(coverUrl, findCoverUrl(s));
    }
  }

  const icestats = o.icestats;
  if (icestats && typeof icestats === "object" && !Array.isArray(icestats)) {
    const source = (icestats as Record<string, unknown>).source;
    if (source && typeof source === "object" && !Array.isArray(source)) {
      const src = source as Record<string, unknown>;
      title = title ?? pickStr(src.title) ?? pickStr(src.song);
      artist = artist ?? pickStr(src.artist);
      coverUrl = mergeCover(coverUrl, findCoverUrl(src));
    }
  }

  if (!title?.trim() && !artist?.trim()) return null;
  return {
    title: (title ?? "").slice(0, 320),
    artist: (artist ?? "").slice(0, 320),
    coverUrl,
  };
}

/** Probeert JSON nu-speelt metadata (incl. artwork-URL); anders platte tekst. */
export function parseNowPlayingPayload(raw: string): ParsedNowPlayingPayload {
  const body = raw.trim();
  if (!body) return { title: "", artist: "", coverUrl: null };

  if (body.startsWith("{") || body.startsWith("[")) {
    try {
      const j = JSON.parse(body) as unknown;
      if (j && typeof j === "object" && !Array.isArray(j)) {
        const got = extractFromRecord(j as Record<string, unknown>);
        if (got) return got;
      }
    } catch {
      /* val terug op tekst */
    }
  }

  const { title, artist } = parseNowPlayingText(body);
  return { title: title.slice(0, 320), artist: artist.slice(0, 320), coverUrl: null };
}
