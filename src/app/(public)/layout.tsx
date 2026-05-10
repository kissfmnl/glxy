import { PublicThemeGuard } from "@/components/public/PublicThemeGuard";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicRadioShell } from "@/components/public/PublicRadioShell";
import { PublicTabTitle } from "@/components/public/PublicTabTitle";
import { MOCK_NAV, MOCK_PUBLIC_UI, MOCK_SOCIAL } from "@/lib/mock/site";
import { PublicFooter } from "@/components/public/PublicFooter";
import { getBranding } from "@/lib/brandingDb";
import { buildGlxyStationsFromDb } from "@/lib/glxyStations";

export const viewport = {
  width: "device-width",
  initialScale: 0.92,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const ui = MOCK_PUBLIC_UI;
  const branding = await getBranding();
  const initialStations = buildGlxyStationsFromDb(branding.stationsConfig);
  const navItems = (branding.navItems?.length ? branding.navItems : [...MOCK_NAV]) as Array<{ href: string; label: string }>;
  const instagramUrl = branding.instagramUrl || MOCK_SOCIAL.instagramUrl;
  const tiktokUrl = branding.tiktokUrl || MOCK_SOCIAL.tiktokUrl;

  return (
    <div
      className="kiss-public-root galaxy-public-root flex min-h-screen w-full max-w-[100%] flex-col overflow-x-hidden text-gray-100"
      style={{
        ["--fallback-album-bg" as string]: ui.fallbackAlbumBg,
        background:
          "radial-gradient(120% 80% at 50% -20%, rgba(56,189,248,0.18), transparent 55%), linear-gradient(180deg, var(--brand-navy) 0%, #0c1028 45%, #080c18 100%)",
      }}
    >
      <PublicTabTitle title={ui.tabTitle} />
      <PublicThemeGuard />
      <PublicHeader
        instagramUrl={instagramUrl}
        tiktokUrl={tiktokUrl}
        navItems={navItems}
        logoUrl={branding.logoUrl}
      />
      <PublicRadioShell
        enabled={ui.showCookieBanner}
        text={ui.cookieBannerText}
        cta={ui.cookieBannerCta}
        initialStations={initialStations}
      >
        {children}
      </PublicRadioShell>

      <PublicFooter footer={branding.footer} siteLogoUrl={branding.logoUrl} />
    </div>
  );
}
