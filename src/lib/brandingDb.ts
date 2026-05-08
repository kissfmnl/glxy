import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEFAULT_HLS = "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8";

export type PublicBranding = {
  primaryHex: string;
  accentHex: string;
  navyHex: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  homeHlsUrl: string;
};

export const getBranding = cache(async (): Promise<PublicBranding> => {
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 } });
    if (row) {
      return {
        primaryHex: row.primaryHex,
        accentHex: row.accentHex,
        navyHex: row.navyHex,
        logoUrl: row.logoUrl,
        faviconUrl: row.faviconUrl,
        homeHlsUrl: row.homeHlsUrl || DEFAULT_HLS,
      };
    }
  } catch {
    /* geen DATABASE_URL of DB down */
  }
  return {
    primaryHex: "#22d3ee",
    accentHex: "#c084fc",
    navyHex: "#0f172a",
    logoUrl: null,
    faviconUrl: null,
    homeHlsUrl: process.env.NEXT_PUBLIC_GLXY_HLS_URL || DEFAULT_HLS,
  };
});
