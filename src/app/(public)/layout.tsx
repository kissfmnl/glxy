import { PublicThemeGuard } from "@/components/public/PublicThemeGuard";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicMiniPlayer } from "@/components/public/PublicMiniPlayer";
import { PublicVisitTracker } from "@/components/public/PublicVisitTracker";
import { CookieNotice } from "@/components/public/CookieNotice";
import { PublicTabTitle } from "@/components/public/PublicTabTitle";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PUBLIC_NAV_ITEMS, resolvePublicNavItems } from "@/lib/publicNavConfig";
import AppImage from "@/components/AppImage";
/** Slightly smaller initial scale on phones (~90% feel) without affecting desktop. */
export const dynamic = "force-dynamic";
export const viewport = {
  width: "device-width",
  initialScale: 0.92,
  maximumScale: 5,
  viewportFit: "cover",
};

function logoSrc() {
  return `/api/assets/Website/Logo/${encodeURIComponent("KISS WITTE LETTERS TRANSPARANT.png")}`;
}

function normalizeHexColor(raw: string | null | undefined, fallback: string) {
  const t = (raw || "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(t)) return t;
  if (/^#[0-9a-f]{3}$/i.test(t)) {
    const h = t.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return fallback;
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const defaultInstagram = "https://instagram.com/kissfmnl";
  const defaultWhatsApp = "https://wa.me/318001078";
  async function getLinks() {
    try {
      const rows = await prisma.siteSetting.findMany({
        where: { key: { in: ["PUBLIC_INSTAGRAM_URL", "PUBLIC_WHATSAPP_URL"] } },
        select: { key: true, value: true },
      });
      const map = new Map(rows.map((r) => [r.key, r.value]));
      return {
        instagramUrl: map.get("PUBLIC_INSTAGRAM_URL") || defaultInstagram,
        whatsAppUrl: map.get("PUBLIC_WHATSAPP_URL") || defaultWhatsApp,
      };
    } catch {
      return {
        instagramUrl: defaultInstagram,
        whatsAppUrl: defaultWhatsApp,
      };
    }
  }
  async function getUiSettings() {
    try {
      const rows = await prisma.siteSetting.findMany({
        where: {
          key: {
            in: [
              "FALLBACK_ALBUM_BG_COLOR",
              "COOKIE_BANNER_SHOW",
              "COOKIE_BANNER_TEXT",
              "COOKIE_BANNER_CTA",
              "PUBLIC_TAB_TITLE",
              ...PUBLIC_NAV_ITEMS.map((i) => i.settingKey),
            ],
          },
        },
        select: { key: true, value: true },
      });
      const map = new Map(rows.map((r) => [r.key, r.value]));
      return {
        fallbackAlbumBg: normalizeHexColor(map.get("FALLBACK_ALBUM_BG_COLOR"), "#f2f8fb"),
        showCookieBanner: (map.get("COOKIE_BANNER_SHOW") || "yes") !== "no",
        cookieBannerText: map.get("COOKIE_BANNER_TEXT") || "Wij gebruiken alleen functionele cookies om de site goed te laten werken.",
        cookieBannerCta: map.get("COOKIE_BANNER_CTA") || "Ok, begrepen",
        tabTitle: map.get("PUBLIC_TAB_TITLE") || "KISS FM",
        navItems: resolvePublicNavItems(map),
      };
    } catch {
      return {
        fallbackAlbumBg: "#f2f8fb",
        showCookieBanner: true,
        cookieBannerText: "Wij gebruiken alleen functionele cookies om de site goed te laten werken.",
        cookieBannerCta: "Ok, begrepen",
        tabTitle: "KISS FM",
        navItems: PUBLIC_NAV_ITEMS.filter((i) => i.defaultVisible).map((i) => ({ href: i.href, label: i.label })),
      };
    }
  }
  const links = await getLinks();
  const ui = await getUiSettings();
  return (
    <div
      className="kiss-public-root min-h-screen w-full max-w-[100%] bg-[#e5eaf0] text-gray-900 overflow-x-hidden flex flex-col"
      style={{ ["--fallback-album-bg" as string]: ui.fallbackAlbumBg }}
    >
      <PublicTabTitle title={ui.tabTitle} />
      <PublicThemeGuard />
      <PublicVisitTracker />
      <PublicHeader
        initialInstagramUrl={links.instagramUrl}
        initialWhatsAppUrl={links.whatsAppUrl}
        navItems={ui.navItems}
      />
      <main className="pt-16 md:pt-[4.5rem] w-full min-w-0 overflow-x-hidden flex-1 flex flex-col min-h-0">
        {children}
      </main>
      <CookieNotice enabled={ui.showCookieBanner} text={ui.cookieBannerText} cta={ui.cookieBannerCta} />
      <PublicMiniPlayer />

      <footer
        id="kiss-public-footer"
        className="relative z-[40] isolate mt-0 mb-[calc(5.25rem+env(safe-area-inset-bottom))] border-t border-white/10 bg-[#1a2f4a]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-full bg-[#1a2f4a]"
          style={{ height: "calc(5.25rem + env(safe-area-inset-bottom))" }}
        />
        <div className="relative z-[1] mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 bg-[#1a2f4a] px-4 py-4 md:px-10 md:py-5">
          <div className="flex shrink-0 items-center gap-1.5 md:gap-2.5">
            <AppImage src={logoSrc()} alt="KISS FM" className="h-10 w-auto object-contain opacity-95 md:h-14" />
          </div>
          <div className="flex items-center gap-3 md:gap-5 text-[11px] md:text-xs font-black text-white/75 flex-wrap justify-end">
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/join-kiss" className="hover:text-white transition-colors">
              Join KISS
            </Link>
            <Link href="/acties" className="hover:text-white transition-colors">
              Acties
            </Link>
            <Link href="/giveaway-voorwaarden" className="hover:text-white transition-colors">
              Giveaway terms
            </Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

