/**
 * GLXY zenders — pas hier namen, streams en kleuren aan.
 * streamUrl: mp3/aac icecast/shoutcast of directe audiobron die de browser aankan.
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

export const GLXY_STATIONS: GlxyStation[] = [
  {
    id: "z1",
    line1: "GLXY MAIN",
    line2: "Live · jouw hits",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cardClass: "bg-[#e11d48] text-white",
  },
  {
    id: "z2",
    line1: "GLXY NON-STOP",
    line2: "Non-stop muziek",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cardClass: "bg-[#84cc16] text-[#1e293b]",
  },
  {
    id: "z3",
    line1: "GLXY GOLF",
    line2: "Andere vibe",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    /** Geel met subtiel patroon via component */
    cardClass: "bg-[#facc15] text-[#1e293b]",
    zebraPattern: true,
  },
  {
    id: "z4",
    line1: "GLXY TOP 40",
    line2: "De grootste hits",
    streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cardClass: "bg-[#7dd3fc] text-[#0f172a]",
  },
];
