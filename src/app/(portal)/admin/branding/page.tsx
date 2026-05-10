import { authOptions } from "@/lib/auth";
import { isPortalAdmin, isSuperAdmin } from "@/lib/authRoles";
import { mergeAdminPortalCopy } from "@/lib/adminPortalCopy";
import { AdminIntroHtml } from "@/components/portal/AdminIntroHtml";
import { prisma } from "@/lib/prisma";
import { BrandingForm } from "./BrandingForm";
import { getServerSession } from "next-auth";
import Link from "next/link";
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
  homeHlsUrl: "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8",
};

export const metadata = {
  title: "Huisstijl — GLXY",
};

export default async function AdminBrandingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let portalIntro = mergeAdminPortalCopy(null).brandingIntroHtml;

  let defaults = {
    ...FALLBACK,
    mainLogoEmbedded: false,
  };
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
        homeHlsUrl: row.homeHlsUrl || FALLBACK.homeHlsUrl,
        mainLogoEmbedded: !!row.logoDataUri,
      };
      portalIntro = mergeAdminPortalCopy(row.adminPortalCopy ?? null).brandingIntroHtml;
    }
  } catch {
    /* database niet beschikbaar */
  }

  const showPortalTekstenLink = session.user.role ? isSuperAdmin(session.user.role) : false;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-[var(--text-main)]">Huisstijl & livestream</h1>
        <AdminIntroHtml html={portalIntro} />
        {showPortalTekstenLink ? (
          <p className="text-xs text-[var(--text-muted)]">
            <Link href="/admin/portal-teksten" className="font-semibold text-[var(--brand-yellow)] underline-offset-2 hover:underline">
              Portalteksten bewerken
            </Link>{" "}
            (super-admin)
          </p>
        ) : null}
      </header>
      <BrandingForm defaults={defaults} />
    </div>
  );
}
