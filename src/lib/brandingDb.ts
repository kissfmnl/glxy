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
  navItems: Array<{ href: string; label: string }> | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  menuBarHex: string | null;
  heroVideoFrameHex: string | null;
  listenBarBgHex: string | null;
  listenBarTextHex: string | null;
  stationColors: Record<string, any> | null;
};

export const getBranding = cache(async (): Promise<PublicBranding> => {
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 } });
    if (row) {
      const navItems =
        Array.isArray(row.navItems) &&
        row.navItems.every((x: any) => x && typeof x.href === "string" && typeof x.label === "string")
          ? (row.navItems as Array<{ href: string; label: string }>)
          : null;
      const stationColors =
        row.stationColors && typeof row.stationColors === "object" && !Array.isArray(row.stationColors)
          ? (row.stationColors as Record<string, any>)
          : null;
      return {
        primaryHex: row.primaryHex,
        accentHex: row.accentHex,
        navyHex: row.navyHex,
        yellowHex: row.yellowHex ?? "#ffe200",
        logoUrl: row.logoUrl,
        faviconUrl: row.faviconUrl,
        homeHlsUrl: row.homeHlsUrl || DEFAULT_HLS,
        navItems,
        instagramUrl: row.instagramUrl ?? null,
        tiktokUrl: row.tiktokUrl ?? null,
        menuBarHex: row.menuBarHex ?? null,
        heroVideoFrameHex: row.heroVideoFrameHex ?? null,
        listenBarBgHex: row.listenBarBgHex ?? null,
        listenBarTextHex: row.listenBarTextHex ?? null,
        stationColors,
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
    navItems: null,
    instagramUrl: null,
    tiktokUrl: null,
    menuBarHex: null,
    heroVideoFrameHex: null,
    listenBarBgHex: null,
    listenBarTextHex: null,
    stationColors: null,
  };
});
