import { MOCK_HOME_WAVE_COPY, MOCK_HERO_BACKDROP_PATHS } from "@/lib/mock/site";
import type { HeroTitleLayout, HeroTitleColor, HomeWaveCopy } from "@/types/home-wave";

export type { HeroTitleLayout, HeroTitleColor, HomeWaveCopy };

export function parseHomeHeroBgPaths(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (Array.isArray(j)) {
      return j
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch {
    /* ignore */
  }
  return [];
}

/** Static homepage copy — no database. */
export async function loadHomeWavePageData(): Promise<{ copy: HomeWaveCopy; heroBgPaths: string[] }> {
  return {
    copy: MOCK_HOME_WAVE_COPY,
    heroBgPaths: [...MOCK_HERO_BACKDROP_PATHS],
  };
}
