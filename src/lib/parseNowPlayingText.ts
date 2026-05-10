/**
 * Parseert platte tekst van een now-playing endpoint.
 * - Twee (of meer) regels: eerste regel = titel, tweede = artiest.
 * - Eén regel met scheidingsteken " - ", " – ", " — " of " | ": klassiek Icecast **Artiest - Titel** → titel onder, artiest eronder op de kaart.
 */
export type ParsedNowPlaying = { title: string; artist: string };

const SEP_PATTERN = /\s*[–—\-|]\s*/;

export function parseNowPlayingText(raw: string): ParsedNowPlaying {
  const body = raw.trim();
  if (!body) return { title: "", artist: "" };

  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    return { title: lines[0]!, artist: lines[1]! };
  }

  const line = lines[0] ?? "";

  const dashSeparators = [" – ", " — ", " - ", " | "];
  for (const sep of dashSeparators) {
    const idx = line.indexOf(sep);
    if (idx !== -1) {
      const artist = line.slice(0, idx).trim();
      const title = line.slice(idx + sep.length).trim();
      return { title, artist };
    }
  }

  const m = line.split(SEP_PATTERN);
  if (m.length >= 2) {
    const artist = m[0]!.trim();
    const title = m.slice(1).join(" - ").trim();
    return { title, artist };
  }

  return { title: line, artist: "" };
}
