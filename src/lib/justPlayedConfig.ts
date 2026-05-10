/** Homepage JUST PLAYED — opgeslagen als Branding.justPlayedConfig (JSON). */

export type JustPlayedConfigInput = {
  titleBgHex?: string;
  titleTextHex?: string;
};

export type PublicJustPlayedConfig = {
  titleBgHex: string;
  titleTextHex: string;
};

export const DEFAULT_JUST_PLAYED: PublicJustPlayedConfig = {
  titleBgHex: "#ffe200",
  titleTextHex: "#111827",
};

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
    titleBgHex: pickHex(o.titleBgHex, DEFAULT_JUST_PLAYED.titleBgHex),
    titleTextHex: pickHex(o.titleTextHex, DEFAULT_JUST_PLAYED.titleTextHex),
  };
}
