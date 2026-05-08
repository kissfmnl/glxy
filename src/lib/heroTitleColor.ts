import type { CSSProperties } from "react";

export type HeroTitlePreset = "white" | "teal";

/** Zelfde als Tailwind `brand.primary` — preset “Teal” op de home hero. */
export const BRAND_TEAL_HEX = "#37bfbf";

/** Server + client: sla alleen presets of #rrggbb op. */
export function normalizeHeroColorInput(raw: string, fallback: HeroTitlePreset): string {
  const t = raw.trim().toLowerCase();
  if (t === "white" || t === "teal") return t;
  if (/^#[0-9a-f]{6}$/.test(t)) return t;
  if (/^#[0-9a-f]{3}$/.test(t)) {
    const h = t.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return fallback;
}

/** UI: native color picker verwacht #rrggbb. */
export function heroColorToPickerHex(value: string | undefined | null): string {
  if (!value?.trim()) return "#ffffff";
  const t = value.trim().toLowerCase();
  if (t === "white") return "#ffffff";
  if (t === "teal") return BRAND_TEAL_HEX;
  if (/^#[0-9a-f]{6}$/i.test(t)) return t.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(t)) {
    const h = t.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return "#ffffff";
}

/**
 * Publieke hero: altijd inline `color` zodat Tailwind-purge (lib/ staat niet in content)
 * nooit meer “teal” laat erven als donkerblauw.
 */
export function heroTitleColorStyle(value: string): { style: CSSProperties } {
  const v = value.trim().toLowerCase();
  if (v === "white") return { style: { color: "#ffffff" } };
  if (v === "teal") return { style: { color: BRAND_TEAL_HEX } };
  if (/^#[0-9a-f]{6}$/i.test(v)) return { style: { color: v } };
  return { style: { color: "#ffffff" } };
}
