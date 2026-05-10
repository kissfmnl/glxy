import { parseNowPlayingPayload } from "@/lib/parseNowPlayingPayload";

export function isAllowedNowPlayingUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Haalt metadata op van externe now-playing URL (JSON of platte tekst / Icecast). */
export async function fetchNowPlayingFromRemoteUrl(
  rawUrl: string,
): Promise<{ title: string; artist: string; coverUrl: string | null }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(rawUrl, {
      signal: ctrl.signal,
      headers: { Accept: "application/json,text/plain,*/*" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return { title: "", artist: "", coverUrl: null };
    const body = await res.text();
    const snippet = body.trim().slice(0, 8000);
    const { title, artist, coverUrl } = parseNowPlayingPayload(snippet);
    return { title: title.slice(0, 320), artist: artist.slice(0, 320), coverUrl };
  } catch {
    return { title: "", artist: "", coverUrl: null };
  }
}
