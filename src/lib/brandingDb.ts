import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEFAULT_HLS = "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8";

export type PublicBranding = {
  primaryHex: string;
  accentHex: string;
  navyHex: string;
  yellowHex: string;
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
        yellowHex: row.yellowHex ?? "#ffe200",
        logoUrl: row.logoUrl,
        faviconUrl: row.faviconUrl,
        homeHlsUrl: row.homeHlsUrl || DEFAULT_HLS,
      };
    }
  } catch {
    /* geen DATABASE_URL of DB down */
  }
  return {
    primaryHex: "#0b7557",
    accentHex: "#6d6d6d",
    navyHex: "#363636",
    yellowHex: "#ffe200",
    logoUrl: null,
    faviconUrl: null,
    homeHlsUrl: process.env.NEXT_PUBLIC_GLXY_HLS_URL || DEFAULT_HLS,
  };
});
