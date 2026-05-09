/** Instellingen voor zenderkaarten, homepage-video-bediening en vaste mini-player (JSON in Branding.playerUi). */

export type PlayerUiConfig = {
  stationPlayHex?: string;
  stationTextHex?: string;
  stationSubtextHex?: string;
  miniBgHex?: string;
  miniTextHex?: string;
  miniMutedHex?: string;
  miniAccentHex?: string;
  miniPlayIconHex?: string;
  miniVolThumbHex?: string;
  miniBorderHex?: string;
  heroVolThumbHex?: string;
  heroControlSurfaceHex?: string;
  heroControlIconHex?: string;
};

export type MergedPlayerUi = Required<PlayerUiConfig>;

export const DEFAULT_PLAYER_UI: MergedPlayerUi = {
  stationPlayHex: "#e11d48",
  stationTextHex: "#ffffff",
  stationSubtextHex: "#e7e7e7",
  miniBgHex: "#3f3f46",
  miniTextHex: "#ffffff",
  miniMutedHex: "#a1a1aa",
  miniAccentHex: "#ffe200",
  miniPlayIconHex: "#18181b",
  miniVolThumbHex: "#ffe200",
  miniBorderHex: "rgba(255,255,255,0.14)",
  heroVolThumbHex: "#ffe200",
  heroControlSurfaceHex: "rgba(255,255,255,0.14)",
  heroControlIconHex: "#ffffff",
};

export function mergePlayerUi(raw: unknown): MergedPlayerUi {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const pick = (k: keyof PlayerUiConfig): string => {
    const v = o[k];
    return typeof v === "string" && v.trim() ? v.trim() : DEFAULT_PLAYER_UI[k];
  };
  return {
    stationPlayHex: pick("stationPlayHex"),
    stationTextHex: pick("stationTextHex"),
    stationSubtextHex: pick("stationSubtextHex"),
    miniBgHex: pick("miniBgHex"),
    miniTextHex: pick("miniTextHex"),
    miniMutedHex: pick("miniMutedHex"),
    miniAccentHex: pick("miniAccentHex"),
    miniPlayIconHex: pick("miniPlayIconHex"),
    miniVolThumbHex: pick("miniVolThumbHex"),
    miniBorderHex: pick("miniBorderHex"),
    heroVolThumbHex: pick("heroVolThumbHex"),
    heroControlSurfaceHex: pick("heroControlSurfaceHex"),
    heroControlIconHex: pick("heroControlIconHex"),
  };
}

/** CSS custom properties voor `document.documentElement`. */
export function playerUiToCssVars(m: MergedPlayerUi): Record<string, string> {
  return {
    "--glxy-station-play": m.stationPlayHex,
    "--glxy-station-text": m.stationTextHex,
    "--glxy-station-subtext": m.stationSubtextHex,
    "--glxy-mini-bg": m.miniBgHex,
    "--glxy-mini-text": m.miniTextHex,
    "--glxy-mini-muted": m.miniMutedHex,
    "--glxy-mini-accent": m.miniAccentHex,
    "--glxy-mini-play-icon": m.miniPlayIconHex,
    "--glxy-mini-vol-thumb": m.miniVolThumbHex,
    "--glxy-mini-border": m.miniBorderHex,
    "--glxy-hero-vol-thumb": m.heroVolThumbHex,
    "--glxy-hero-control-surface": m.heroControlSurfaceHex,
    "--glxy-hero-control-icon": m.heroControlIconHex,
  };
}
