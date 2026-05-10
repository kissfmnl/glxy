/** Nu-speelt tekstfilter — Branding.npWordFilter (JSON). */

export type PublicNpWordFilter = {
  phrases: string[];
};

const MAX_PHRASES = 40;
const MAX_PHRASE_LEN = 160;

export function mergeNpWordFilter(raw: unknown): PublicNpWordFilter {
  const empty: PublicNpWordFilter = { phrases: [] };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;
  const o = raw as Record<string, unknown>;
  const arr = o.phrases;
  if (!Array.isArray(arr)) return empty;
  const phrases = arr
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_PHRASES)
    .map((s) => s.slice(0, MAX_PHRASE_LEN));
  return { phrases };
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Verwijdert alle phrases uit titel en artiest (hoofdletterongevoelig). Dubbele spaties worden genormaliseerd. */
export function applyNpWordFilter(title: string, artist: string, phrases: string[]): { title: string; artist: string } {
  let t = title;
  let a = artist;
  for (const p of phrases) {
    const needle = p.trim();
    if (!needle) continue;
    const re = new RegExp(escapeRegExp(needle), "gi");
    t = t.replace(re, " ");
    a = a.replace(re, " ");
  }
  return {
    title: t.replace(/\s+/g, " ").trim(),
    artist: a.replace(/\s+/g, " ").trim(),
  };
}
