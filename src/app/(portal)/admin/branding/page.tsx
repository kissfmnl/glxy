import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandingForm } from "./BrandingForm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const FALLBACK = {
  primaryHex: "#0b7557",
  accentHex: "#6d6d6d",
  navyHex: "#363636",
  yellowHex: "#ffe200",
  logoUrl: "",
  faviconUrl: "",
  navItems: [
    { href: "/", label: "Home" },
    { href: "/glxy-tv", label: "GLXY TV" },
    { href: "/playlist", label: "Playlist" },
    { href: "/adverteren", label: "Adverteren" },
    { href: "/drop-n-demo", label: "Drop 'n Demo" },
    { href: "/passdeaux", label: "Passdeaux" },
    { href: "/airplay-top-20", label: "Airplay Top 20" },
    { href: "/frequenties", label: "Frequenties" },
    { href: "/press", label: "Press" },
  ],
  instagramUrl: "https://instagram.com",
  tiktokUrl: "https://www.tiktok.com",
  menuBarHex: "#0b7557",
  heroVideoFrameHex: "#ffe200",
  listenBarBgHex: "#0b7557",
  listenBarTextHex: "#ffffff",
  stationColors: {
    z1: "#e11d48",
    z2: "#84cc16",
    z3: "#facc15",
    z4: "#7dd3fc",
  },
  homeHlsUrl: "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8",
};

export const metadata = {
  title: "Huisstijl — GLXY",
};

export default async function AdminBrandingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  let defaults = { ...FALLBACK };
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 } });
    if (row) {
      const navItems =
        Array.isArray(row.navItems) &&
        row.navItems.every((x: any) => x && typeof x.href === "string" && typeof x.label === "string")
          ? (row.navItems as Array<{ href: string; label: string }>)
          : FALLBACK.navItems;
      defaults = {
        primaryHex: row.primaryHex,
        accentHex: row.accentHex,
        navyHex: row.navyHex,
        yellowHex: row.yellowHex ?? FALLBACK.yellowHex,
        logoUrl: row.logoUrl ?? "",
        faviconUrl: row.faviconUrl ?? "",
        navItems,
        instagramUrl: row.instagramUrl ?? FALLBACK.instagramUrl,
        tiktokUrl: row.tiktokUrl ?? FALLBACK.tiktokUrl,
        menuBarHex: row.menuBarHex ?? FALLBACK.menuBarHex,
        heroVideoFrameHex: row.heroVideoFrameHex ?? FALLBACK.heroVideoFrameHex,
        listenBarBgHex: row.listenBarBgHex ?? FALLBACK.listenBarBgHex,
        listenBarTextHex: row.listenBarTextHex ?? FALLBACK.listenBarTextHex,
        stationColors:
          row.stationColors && typeof row.stationColors === "object" && !Array.isArray(row.stationColors)
            ? (row.stationColors as any)
            : FALLBACK.stationColors,
        homeHlsUrl: row.homeHlsUrl || FALLBACK.homeHlsUrl,
      };
    }
  } catch {
    /* database niet beschikbaar */
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-main)]">Huisstijl & livestream</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Publieke GLXY-site: kleuren via CSS-variabelen, optioneel logo in de header, favicon, en de HLS-embed op de homepage.
        </p>
      </header>
      <BrandingForm defaults={defaults} />
    </div>
  );
}
