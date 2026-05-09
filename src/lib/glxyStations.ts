/**
 * GLXY zenders — defaults in code; inhoud kan via Branding.stationsConfig worden overschreven.
 */
export type GlxyStation = {
  id: string;
  /** Hoofdregel op de kaart (meestal titel / “nu speelt”) */
  line1: string;
  /** Tweede regel (artiest of slogan) */
  line2: string;
  /** Stream-URL */
  streamUrl: string;
  /** Optioneel logo (https of pad op deze site, bv. /logo.png) */
  logoUrl?: string;
  /** Volledige Tailwind-classes voor de kaart (bg + tekstkleur) */
  cardClass: string;
  /** Optioneel: licht zebra-/streeppatroon (geel kaart-effect) */
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
};

export const GLXY_STATIONS: GlxyStation[] = [
  {
    id: "z1",
    line1: "GLXY Main",
    line2: "Live · Jouw hits",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cardClass: "bg-[#e11d48] text-white",
  },
  {
    id: "z2",
    line1: "GLXY Non-Stop",
    line2: "Non-stop muziek",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cardClass: "bg-[#84cc16] text-[#1e293b]",
  },
  {
    id: "z3",
    line1: "GLXY Golf",
    line2: "Andere vibe",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    /** Geel met subtiel patroon via component */
    cardClass: "bg-[#facc15] text-[#1e293b]",
    zebraPattern: true,
  },
  {
    id: "z4",
    line1: "GLXY Top 40",
    line2: "De grootste hits",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cardClass: "bg-[#7dd3fc] text-[#0f172a]",
  },
];

/** Merge DB `stationsConfig` met defaults (volgorde en ontbrekende velden uit code). */
export function buildGlxyStationsFromDb(stationsConfig: unknown): GlxyStation[] {
  const defaults = GLXY_STATIONS;
  const map = new Map(defaults.map((s) => [s.id, { ...s }]));
  if (Array.isArray(stationsConfig)) {
    for (const row of stationsConfig) {
      if (!row || typeof row !== "object") continue;
      const id = String((row as GlxyStationInput).id ?? "").trim();
      if (!map.has(id)) continue;
      const base = map.get(id)!;
      const r = row as GlxyStationInput & { logoUrl?: string };
      if (typeof r.line1 === "string") base.line1 = r.line1.trim();
      if (typeof r.line2 === "string") base.line2 = r.line2.trim();
      if (typeof r.streamUrl === "string") base.streamUrl = r.streamUrl.trim();
      if (typeof r.logoUrl === "string" && r.logoUrl.trim()) {
        base.logoUrl = r.logoUrl.trim();
      }
    }
  }
  return defaults.map((d) => map.get(d.id)!);
}

/** Admin formulier: geen megabytes data-URI in het invoerveld; wel embedded-flag per zender. */
export function stationsForAdminFormDefaults(stationsConfig: unknown): {
  stations: GlxyStationInput[];
  stationsLogoEmbedded: Record<string, boolean>;
} {
  const merged = buildGlxyStationsFromDb(stationsConfig);
  const stations: GlxyStationInput[] = [];
  const stationsLogoEmbedded: Record<string, boolean> = {};
  for (const s of merged) {
    const isEmbedded = !!s.logoUrl?.startsWith("data:image/");
    stationsLogoEmbedded[s.id] = isEmbedded;
    stations.push({
      id: s.id,
      line1: s.line1,
      line2: s.line2,
      streamUrl: s.streamUrl,
      logoUrl: isEmbedded ? "" : (s.logoUrl ?? ""),
    });
  }
  return { stations, stationsLogoEmbedded };
}
