/** Publieke footer — opgeslagen als Branding.footerConfig (JSON). */

export type FooterConfigInput = {
  bgHex?: string;
  iconHex?: string;
  /** Optioneel footer-logo; leeg = gebruik site-logo uit branding. */
  logoUrl?: string | null;
  whatsappUrl?: string | null;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  twitchUrl?: string | null;
  mailUrl?: string | null;
};

export type PublicFooterConfig = {
  bgHex: string;
  iconHex: string;
  logoUrl: string | null;
  whatsappUrl: string | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  twitchUrl: string | null;
  mailUrl: string | null;
};

export const DEFAULT_FOOTER_LINKS: Omit<PublicFooterConfig, "logoUrl"> = {
  bgHex: "#ffe200",
  iconHex: "#111827",
  whatsappUrl: "https://wa.me/31850292222",
  tiktokUrl: "https://www.tiktok.com/@glxy.radio",
  instagramUrl: "https://www.instagram.com/glxyradio/",
  youtubeUrl: "https://www.youtube.com/channel/UCKzy3wJK7MrOzffUys_y0OQ",
  twitchUrl: "https://www.twitch.tv/glxy_radio",
  mailUrl: "mailto:studio@glxy.radio",
};

function pickStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
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

export function mergeFooterConfig(raw: unknown): PublicFooterConfig {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    bgHex: pickHex(o.bgHex, DEFAULT_FOOTER_LINKS.bgHex),
    iconHex: pickHex(o.iconHex, DEFAULT_FOOTER_LINKS.iconHex),
    logoUrl: pickStr(o.logoUrl),
    whatsappUrl: pickStr(o.whatsappUrl) ?? DEFAULT_FOOTER_LINKS.whatsappUrl,
    tiktokUrl: pickStr(o.tiktokUrl) ?? DEFAULT_FOOTER_LINKS.tiktokUrl,
    instagramUrl: pickStr(o.instagramUrl) ?? DEFAULT_FOOTER_LINKS.instagramUrl,
    youtubeUrl: pickStr(o.youtubeUrl) ?? DEFAULT_FOOTER_LINKS.youtubeUrl,
    twitchUrl: pickStr(o.twitchUrl) ?? DEFAULT_FOOTER_LINKS.twitchUrl,
    mailUrl: pickStr(o.mailUrl) ?? DEFAULT_FOOTER_LINKS.mailUrl,
  };
}
