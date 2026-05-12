import type { PublicJustPlayedConfig } from "@/lib/justPlayedConfig";

/** Gedeelde listing-rij: JUST PLAYED + programmering (zelfde “streaming”-chrome). */
export const GLXY_HOME_LIST_ROW_CLASS =
  "group flex overflow-hidden rounded-lg border border-[#1e293b] bg-[#101822] transition-all duration-200 hover:-translate-y-px hover:border-white/[0.12] hover:shadow-[0_10px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(11,117,87,0.22)]";

/** Zender-tabs + dagen-tabs — zelfde pill-strip. */
export const GLXY_HOME_TAB_STRIP_CLASS =
  "mb-2 flex gap-1 rounded-lg p-1 ring-1 ring-white/[0.06] sm:mb-2.5";

/** Zelfde max scrollhoogte in beide panelen (geen enorme lege schedule-kolom). */
export const GLXY_HOME_LIST_SCROLL_CLASS =
  "kiss-public-panel-scroll max-h-[min(22rem,52vh)] overflow-y-auto [-webkit-overflow-scrolling:touch]";

export function glxyAccentRailStyle(theme: Pick<PublicJustPlayedConfig, "panelBorderHex" | "sectionAccentHex">) {
  return {
    backgroundColor: "#0c121c",
    borderRight: `1px solid ${theme.panelBorderHex}`,
    borderLeft: `3px solid ${theme.sectionAccentHex}`,
  };
}
