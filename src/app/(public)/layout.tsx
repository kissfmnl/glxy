import { PublicThemeGuard } from "@/components/public/PublicThemeGuard";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicMiniPlayer } from "@/components/public/PublicMiniPlayer";
import { CookieNotice } from "@/components/public/CookieNotice";
import { PublicTabTitle } from "@/components/public/PublicTabTitle";
import Link from "next/link";
import { MOCK_NAV, MOCK_PUBLIC_UI, MOCK_SOCIAL } from "@/lib/mock/site";
import { GlxyWordmark } from "@/components/public/GlxyWordmark";
import { getBranding } from "@/lib/brandingDb";

export const viewport = {
  width: "device-width",
  initialScale: 0.92,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const ui = MOCK_PUBLIC_UI;
  const navItems = [...MOCK_NAV] as Array<{ href: string; label: string }>;
  const branding = await getBranding();

  return (
    <div
      className="kiss-public-root galaxy-public-root flex min-h-screen w-full max-w-[100%] flex-col overflow-x-hidden bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(56,189,248,0.18),transparent_55%),linear-gradient(180deg,#070a14_0%,#0c1028_45%,#080c18_100%)] text-gray-100"
      style={{ ["--fallback-album-bg" as string]: ui.fallbackAlbumBg }}
    >
      <PublicTabTitle title={ui.tabTitle} />
      <PublicThemeGuard />
      <PublicHeader
        instagramUrl={MOCK_SOCIAL.instagramUrl}
        tiktokUrl={MOCK_SOCIAL.tiktokUrl}
        navItems={navItems}
        logoUrl={branding.logoUrl}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden pt-16 md:pt-[4.5rem]">
        {children}
      </main>
      <CookieNotice enabled={ui.showCookieBanner} text={ui.cookieBannerText} cta={ui.cookieBannerCta} />
      <PublicMiniPlayer />

      <footer
        id="kiss-public-footer"
        className="relative z-[40] isolate mt-0 mb-[calc(5.25rem+env(safe-area-inset-bottom))] border-t border-cyan-500/15 bg-[#060914]/95 backdrop-blur-sm"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-full bg-[#060914]"
          style={{ height: "calc(5.25rem + env(safe-area-inset-bottom))" }}
        />
        <div className="relative z-[1] mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-4 bg-transparent px-4 py-4 md:px-10 md:py-5">
          <div className="flex shrink-0 items-center gap-1.5 md:gap-2.5">
            <GlxyWordmark className="text-xl md:text-2xl" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 font-black text-white/65 md:gap-5 text-[11px] md:text-xs">
            <Link href="/contact" className="transition-colors hover:text-cyan-200">
              Contact
            </Link>
            <Link href="/join-kiss" className="transition-colors hover:text-cyan-200">
              Word host
            </Link>
            <Link href="/acties" className="transition-colors hover:text-cyan-200">
              Acties
            </Link>
            <Link href="/giveaway-voorwaarden" className="transition-colors hover:text-cyan-200">
              Giveaway-voorwaarden
            </Link>
            <Link href="/disclaimer" className="transition-colors hover:text-cyan-200">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
