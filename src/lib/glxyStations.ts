/**
 * GLXY zenders — defaults in code; volgorde en extra zenders via Branding.stationsConfig (JSON-array).
 */
export type GlxyStation = {
  id: string;
  /** Fallback titel op de kaart als er geen live metadaten zijn */
  line1: string;
  /** Fallback artiest / tweede regel */
  line2: string;
  streamUrl: string;
  logoUrl?: string;
  /** Plain-text URL (bv. Icecast currentsong) voor titel/artiest op de kaart */
  nowPlayingUrl?: string;
  /** Icoonkleur van de play-knop (hex), optioneel */
  playButtonHex?: string;
  cardClass: string;
  zebraPattern?: boolean;
};

/** Client → server: behoud ingesloten zenderlogo als het invoerveld leeg blijft. */
export const KEEP_STATION_LOGO = "__KEEP_STATION_LOGO__";

export type GlxyStationInput = {
  id: string;
  line1: string;
  line2: string;
  streamUrl: string;
  logoUrl: string;
  nowPlayingUrl: string;
  playButtonHex: string;
  /** Niet op homepage tonen (wel in admin beheren) */
  offAir?: boolean;
};

const CHANNEL_ORDER = ["z1", "z2", "z3", "z4"] as const;

/** Z1–Z4 vaste namen; andere id’s = volgnummer op de homepage. */
export function glxyChannelHeading(id: string, indexOnPage?: number): string {
  const fixed = CHANNEL_ORDER.indexOf(id as (typeof CHANNEL_ORDER)[number]);
  if (fixed >= 0) return `GLXY-KANAAL ${fixed + 1}`;
  if (typeof indexOnPage === "number") return `GLXY-ZENDER ${indexOnPage + 1}`;
  return id.toUpperCase();
}

export const GLXY_STATIONS: GlxyStation[] = [
  {
    id: "z1",
    line1: "GLXY Radio",
    line2: "Live · jouw hits",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cardClass: "bg-[#0b7557] text-white",
    playButtonHex: "#0b7557",
  },
  {
    id: "z2",
    line1: "GLXY State",
    line2: "Hiphop & r&b",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cardClass: "bg-[#111816] text-white",
    playButtonHex: "#dc2626",
  },
  {
    id: "z3",
    line1: "GLXY Throwback",
    line2: "Classic hits",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cardClass: "text-zinc-950",
    zebraPattern: true,
    playButtonHex: "#0b7557",
  },
  {
    id: "z4",
    line1: "GLXY Non-stop",
    line2: "24/7 muziek",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cardClass: "bg-[#064e3b] text-white",
    playButtonHex: "#ffe200",
  },
];

const DEFAULT_MAP = new Map(GLXY_STATIONS.map((s) => [s.id, { ...s }]));

function dynamicTemplate(i: number): GlxyStation {
  const d = GLXY_STATIONS[i % GLXY_STATIONS.length]!;
  return {
    id: "",
    line1: "GLXY Radio",
    line2: "—",
    streamUrl: "",
    cardClass: d.cardClass,
    zebraPattern: d.zebraPattern,
  };
}

function applyRow(base: GlxyStation, row: Record<string, unknown>): void {
  const r = row as GlxyStationInput & { logoUrl?: string; nowPlayingUrl?: string; playButtonHex?: string };
  if (typeof r.line1 === "string") base.line1 = r.line1.trim();
  if (typeof r.line2 === "string") base.line2 = r.line2.trim();
  if (typeof r.streamUrl === "string") base.streamUrl = r.streamUrl.trim();
  if (typeof r.logoUrl === "string" && r.logoUrl.trim()) {
    base.logoUrl = r.logoUrl.trim();
  }
  if (typeof r.nowPlayingUrl === "string" && r.nowPlayingUrl.trim()) {
    base.nowPlayingUrl = r.nowPlayingUrl.trim();
  }
  if (typeof r.playButtonHex === "string" && r.playButtonHex.trim()) {
    base.playButtonHex = r.playButtonHex.trim();
  }
}

/** Merge DB `stationsConfig` met defaults; volgorde = array-volgorde; off-air wordt gefilterd voor publiek. */
export function buildGlxyStationsFromDb(stationsConfig: unknown): GlxyStation[] {
  if (!Array.isArray(stationsConfig) || stationsConfig.length === 0) {
    return GLXY_STATIONS.map((d) => ({ ...DEFAULT_MAP.get(d.id)! }));
  }

  const out: GlxyStation[] = [];
  let dyn = 0;
  for (const row of stationsConfig) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (o.offAir === true) continue;
    const id = String(o.id ?? "").trim();
    if (!id) continue;

    const base = DEFAULT_MAP.has(id)
      ? { ...DEFAULT_MAP.get(id)!, id }
      : { ...dynamicTemplate(dyn++), id };
    applyRow(base, o);
    out.push(base);
  }

  return out.length > 0 ? out : GLXY_STATIONS.map((d) => ({ ...DEFAULT_MAP.get(d.id)! }));
}

/** Admin: alle rijen zoals in DB (inclusief off-air), met defaults ingevuld. */
export function stationsForAdminFormDefaults(stationsConfig: unknown): {
  stations: GlxyStationInput[];
  stationsLogoEmbedded: Record<string, boolean>;
} {
  const rows: unknown[] = Array.isArray(stationsConfig) && stationsConfig.length > 0 ? stationsConfig : GLXY_STATIONS.map((s) => ({ id: s.id }));

  const stations: GlxyStationInput[] = [];
  const stationsLogoEmbedded: Record<string, boolean> = {};
  let dyn = 0;

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    if (!id) continue;

    const base = DEFAULT_MAP.has(id)
      ? { ...DEFAULT_MAP.get(id)!, id }
      : { ...dynamicTemplate(dyn++), id };
    applyRow(base, o);

    const isEmbedded = !!base.logoUrl?.startsWith("data:image/");
    stationsLogoEmbedded[id] = isEmbedded;
    stations.push({
      id,
      line1: base.line1,
      line2: base.line2,
      streamUrl: base.streamUrl,
      logoUrl: isEmbedded ? "" : (base.logoUrl ?? ""),
      nowPlayingUrl: base.nowPlayingUrl ?? "",
      playButtonHex: base.playButtonHex ?? "",
      offAir: o.offAir === true,
    });
  }

  return { stations, stationsLogoEmbedded };
}

/** NP-endpoint: zoekt ruwe nowPlayingUrl ook bij off-air rijen (homepage filtert die eruit). */
export function resolveStationNowPlayingUrl(stationsConfig: unknown, id: string): string | null {
  if (!Array.isArray(stationsConfig)) return null;
  for (const row of stationsConfig) {
    if (!row || typeof row !== "object") continue;
    if (String((row as { id?: string }).id ?? "").trim() !== id) continue;
    const u = String((row as { nowPlayingUrl?: string }).nowPlayingUrl ?? "").trim();
    return u || null;
  }
  return null;
}
