/** Homepage JUST PLAYED + SCHEDULE — Branding.justPlayedConfig (JSON). Premium donkere stijl + zender-tabs. */

export type JustPlayedConfigInput = {
  /** Aantal tracks zichtbaar in JUST PLAYED (1–50). */
  recentTracksDisplayLimit?: number;
  sectionTitleHex?: string;
  sectionAccentHex?: string;
  panelSurfaceHex?: string;
  panelBorderHex?: string;
  stationTabSelectedBgHex?: string;
  stationTabSelectedTextHex?: string;
  stationTabInactiveBgHex?: string;
  stationTabInactiveBorderHex?: string;
  playlistLinkHex?: string;
  /** Legacy velden (worden genegeerd voor layout, alleen voor oude exports) */
  titleBgHex?: string;
  titleTextHex?: string;
  scheduleTitleBgHex?: string;
  scheduleTitleTextHex?: string;
};

export type PublicJustPlayedConfig = {
  recentTracksDisplayLimit: number;
  sectionTitleHex: string;
  sectionAccentHex: string;
  panelSurfaceHex: string;
  panelBorderHex: string;
  stationTabSelectedBgHex: string;
  stationTabSelectedTextHex: string;
  stationTabInactiveBgHex: string;
  stationTabInactiveBorderHex: string;
  playlistLinkHex: string;
};

export const DEFAULT_JUST_PLAYED: PublicJustPlayedConfig = {
  recentTracksDisplayLimit: 10,
  sectionTitleHex: "#cbd5e1",
  sectionAccentHex: "#2dd4bf",
  panelSurfaceHex: "#0b1020",
  panelBorderHex: "#152238",
  stationTabSelectedBgHex: "#134e4a",
  stationTabSelectedTextHex: "#ecfeff",
  stationTabInactiveBgHex: "#060a12",
  stationTabInactiveBorderHex: "#1e293b",
  playlistLinkHex: "#5eead4",
};

const DISPLAY_LIMIT_MIN = 1;
const DISPLAY_LIMIT_MAX = 50;

function pickInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseInt(String(v).trim(), 10) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(DISPLAY_LIMIT_MAX, Math.max(DISPLAY_LIMIT_MIN, Math.round(n)));
}

function pickHex(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  let t = v.trim();
  if (!t) return fallback;
  if (!t.startsWith("#")) t = `#${t}`;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (!m) return fallback;
  return `#${m[1]!.length === 3 ? m[1]!.split("").map((c) => c + c).join("") : m[1]!}`.toLowerCase();
}

export function mergeJustPlayedConfig(raw: unknown): PublicJustPlayedConfig {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    recentTracksDisplayLimit: pickInt(o.recentTracksDisplayLimit, DEFAULT_JUST_PLAYED.recentTracksDisplayLimit),
    sectionTitleHex: pickHex(o.sectionTitleHex, DEFAULT_JUST_PLAYED.sectionTitleHex),
    sectionAccentHex: pickHex(o.sectionAccentHex, DEFAULT_JUST_PLAYED.sectionAccentHex),
    panelSurfaceHex: pickHex(o.panelSurfaceHex, DEFAULT_JUST_PLAYED.panelSurfaceHex),
    panelBorderHex: pickHex(o.panelBorderHex, DEFAULT_JUST_PLAYED.panelBorderHex),
    stationTabSelectedBgHex: pickHex(o.stationTabSelectedBgHex, DEFAULT_JUST_PLAYED.stationTabSelectedBgHex),
    stationTabSelectedTextHex: pickHex(o.stationTabSelectedTextHex, DEFAULT_JUST_PLAYED.stationTabSelectedTextHex),
    stationTabInactiveBgHex: pickHex(o.stationTabInactiveBgHex, DEFAULT_JUST_PLAYED.stationTabInactiveBgHex),
    stationTabInactiveBorderHex: pickHex(o.stationTabInactiveBorderHex, DEFAULT_JUST_PLAYED.stationTabInactiveBorderHex),
    playlistLinkHex: pickHex(o.playlistLinkHex, DEFAULT_JUST_PLAYED.playlistLinkHex),
  };
}
