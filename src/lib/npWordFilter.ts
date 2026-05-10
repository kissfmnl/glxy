/** Nu-speelt tekstfilter — Branding.npWordFilter (JSON). */

export type NpFilterMode = "strip" | "hide_full";

export type NpFilterRule = {
  phrase: string;
  mode: NpFilterMode;
};

export type PublicNpWordFilter = {
  rules: NpFilterRule[];
};

const MAX_RULES = 40;
const MAX_PHRASE_LEN = 160;

function trimPhrase(s: string): string {
  return s.trim().slice(0, MAX_PHRASE_LEN);
}

function normalizeMode(item: Record<string, unknown>): NpFilterMode {
  const m = item.mode;
  if (m === "hide_full") return "hide_full";
  if (m === "strip") return "strip";
  /** Legacy `scope` → altijd strip-gedrag */
  return "strip";
}

/** Leest { rules } óf legacy { phrases } / oude scope-rules. */
export function mergeNpWordFilter(raw: unknown): PublicNpWordFilter {
  const empty: PublicNpWordFilter = { rules: [] };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;
  const o = raw as Record<string, unknown>;

  const rulesRaw = o.rules;
  if (Array.isArray(rulesRaw)) {
    const rules: NpFilterRule[] = [];
    for (const item of rulesRaw) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const r = item as Record<string, unknown>;
      const phrase = trimPhrase(typeof r.phrase === "string" ? r.phrase : "");
      if (!phrase) continue;
      rules.push({ phrase, mode: normalizeMode(r) });
      if (rules.length >= MAX_RULES) break;
    }
    return { rules };
  }

  const arr = o.phrases;
  if (!Array.isArray(arr)) return empty;
  const rules: NpFilterRule[] = [];
  for (const x of arr) {
    if (typeof x !== "string") continue;
    const phrase = trimPhrase(x);
    if (!phrase) continue;
    rules.push({ phrase, mode: "strip" });
    if (rules.length >= MAX_RULES) break;
  }
  return { rules };
}

export function hideFullPhrases(filter: PublicNpWordFilter): string[] {
  return filter.rules.filter((r) => r.mode === "hide_full").map((r) => r.phrase);
}

export function stripPhrases(filter: PublicNpWordFilter): string[] {
  return filter.rules.filter((r) => r.mode === "strip").map((r) => r.phrase);
}

/** Hoofdletterongevoelige deelstring in titel of artiest. */
export function matchesHideFull(title: string, artist: string, hidePhrases: string[]): boolean {
  const blob = `${title}\n${artist}`.toLowerCase();
  for (const p of hidePhrases) {
    const n = p.trim().toLowerCase();
    if (!n) continue;
    if (blob.includes(n)) return true;
  }
  return false;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Verwijdert gegeven phrases uit titel en artiest (hoofdletterongevoelig). */
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

/**
 * Live + geschiedenis: eerst hide_full op ruwe metadata → leeg en geen logging.
 * Anders alleen strip-regels toepassen (nu-speelt én just played).
 */
export function processNowPlayingMetadata(
  rawTitle: string,
  rawArtist: string,
  filter: PublicNpWordFilter,
): { title: string; artist: string } {
  const hide = hideFullPhrases(filter);
  if (matchesHideFull(rawTitle, rawArtist, hide)) {
    return { title: "", artist: "" };
  }
  const strips = stripPhrases(filter);
  return strips.length > 0 ? applyNpWordFilter(rawTitle, rawArtist, strips) : { title: rawTitle.trim(), artist: rawArtist.trim() };
}
