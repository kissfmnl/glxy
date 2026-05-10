/** Nu-speelt tekstfilter — Branding.npWordFilter (JSON). */

export type NpFilterScope = "everywhere" | "live_np_only";

export type NpFilterRule = {
  phrase: string;
  scope: NpFilterScope;
};

export type PublicNpWordFilter = {
  rules: NpFilterRule[];
};

const MAX_RULES = 40;
const MAX_PHRASE_LEN = 160;

function normalizeScope(v: unknown): NpFilterScope {
  if (v === "live_np_only") return "live_np_only";
  return "everywhere";
}

function trimPhrase(s: string): string {
  return s.trim().slice(0, MAX_PHRASE_LEN);
}

/** Leest nieuw formaat { rules } óf legacy { phrases } (alles = everywhere). */
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
      rules.push({ phrase, scope: normalizeScope(r.scope) });
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
    rules.push({ phrase, scope: "everywhere" });
    if (rules.length >= MAX_RULES) break;
  }
  return { rules };
}

/** Alle termen: live nu-speelt (kaarten, mini-player), snapshot, programmering-liveblok. */
export function phraseListForLiveNp(filter: PublicNpWordFilter): string[] {
  return filter.rules.map((r) => r.phrase);
}

/** Alleen “overal”: ook uit Just played / geschiedenis en niet meer zichtbaar daar. */
export function phraseListEverywhere(filter: PublicNpWordFilter): string[] {
  return filter.rules.filter((r) => r.scope === "everywhere").map((r) => r.phrase);
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
