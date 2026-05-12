import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";
import { HomeProgrammingSchedule } from "@/components/public/HomeProgrammingSchedule";
import { RecentTracksPanel } from "@/components/public/RecentTracksPanel";
import { ConcertsPanel } from "@/components/public/ConcertsPanel";
import { ActionsPanel } from "@/components/public/ActionsPanel";
import { SocialProfilePanel } from "@/components/public/SocialProfilePanel";
import { AppDownloadPopup } from "@/components/public/AppDownloadPopup";
import { HomeHeroBackdrop } from "@/components/public/HomeHeroBackdrop";
import type { CSSProperties } from "react";
import type { HomeWaveCopy } from "@/types/home-wave";
import AppImage from "@/components/AppImage";
import { GlxyHeroLogoVideo } from "@/components/public/GlxyHeroLogoVideo";
import { GlxyStationListenStrip } from "@/components/public/GlxyStationListenStrip";
import type { GlxyStation } from "@/lib/glxyStations";
import type { PublicJustPlayedConfig } from "@/lib/justPlayedConfig";
import type { MockProgrammingSlot } from "@/lib/mock/site";

export type HomeImageTile = { src: string; alt: string; slug?: string; focalX?: number; focalY?: number };

function VoicesSidebar({ title, djs, maxItems }: { title: string; djs: HomeImageTile[]; maxItems: number }) {
  const list = djs.filter((d) => d.src).slice(0, Math.max(4, maxItems));
  if (list.length === 0) return null;
  return (
    <aside className="hidden lg:flex flex-col w-full min-w-0 kiss-public-panel rounded-3xl border border-solid border-[#1e375a]/12 bg-[#f2f8fb] shadow-[0_2px_16px_rgba(30,55,90,0.05)] overflow-hidden">
      <div className={`${KISS_PANEL_HEADER_BOX} shrink-0`}>
        <p className={KISS_PANEL_TITLE}>{title}</p>
      </div>
      <div className={`${KISS_PANEL_BODY_PAD} pt-0 grid gap-2.5 ${KISS_PANEL_HEADER_GAP}`}>
        {list.map((t, i) => (
          <a
            key={`${t.src}-v-${i}`}
            href={t.slug ? `/djs/${encodeURIComponent(t.slug)}` : "/djs"}
            className="group relative rounded-2xl overflow-hidden border border-[#1e375a]/12 bg-white shadow-[0_8px_22px_rgba(30,55,90,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#37bfbf]"
          >
            <div className="relative aspect-[1/1]">
              <AppImage
                src={t.src}
                alt={t.alt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ objectPosition: `${t.focalX ?? 50}% ${t.focalY ?? 50}%` }}
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute inset-x-0 bottom-0 px-3 pb-2 text-left text-sm font-black text-white leading-tight line-clamp-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]">
                {t.alt}
              </p>
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
}

export function HomeWaveLayout({
  copy,
  heroBackdropSlides,
  trackCovers = [],
  djPhotos = [],
  homeHlsSrc,
  stationColors,
  stations,
  heroLogoUrl,
  programmingSlots,
  programmingTemporarySlots,
  justPlayedUi,
}: {
  copy: HomeWaveCopy;
  heroBackdropSlides: { src: string }[];
  trackCovers?: HomeImageTile[];
  djPhotos?: HomeImageTile[];
  /** HLS .m3u8 URL for homepage live embed */
  homeHlsSrc?: string | null;
  stationColors?: Record<string, string> | null;
  stations: GlxyStation[];
  /** Admin-uploaded logo; valt terug op `/glxy-hero-logo-fallback.svg` */
  heroLogoUrl?: string | null;
  programmingSlots: MockProgrammingSlot[];
  programmingTemporarySlots: (MockProgrammingSlot & { startsOn: string; endsOn: string; isActive: boolean })[];
  justPlayedUi: PublicJustPlayedConfig;
}) {
  const autoVoicesCount = copy.showInstagramPanel && copy.showTikTokPanel ? 4 : copy.showInstagramPanel || copy.showTikTokPanel ? 5 : 6;
  const voicesCount = copy.voicesPhotoCount ?? autoVoicesCount;
  const heroLogoSrc = heroLogoUrl?.trim() ? heroLogoUrl.trim() : "/glxy-hero-logo-fallback.svg";

  const showJp = copy.showRecentTracksPanel;
  const showProg = copy.showCurrentShowPanel;
  const showProgrammingRow = showJp || showProg;
  const stationGridN = Math.max(stations.length, 1);
  const splitAlignStrip = showJp && showProg && stationGridN >= 2;

  return (
    <div className="relative flex-1 flex flex-col min-h-0 min-w-0 max-w-full w-full">
      <section className="relative z-10 -mt-16 md:-mt-[4.5rem] overflow-visible bg-[#060a14] pb-8 pt-[5.25rem] shadow-[0_24px_70px_rgba(4,8,20,0.5)] sm:pb-10 md:pb-12 md:pt-28 lg:pt-32">
        <div className="absolute inset-0 overflow-hidden">
          <HomeHeroBackdrop slides={heroBackdropSlides} motionEnabled={copy.heroBackdropMotion} />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[#050912]/58"
          style={{
            WebkitBackdropFilter: "blur(12px)",
            backdropFilter: "blur(12px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#050912]/94 via-[#071520]/82 to-[#0c2238]/90"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_95%_58%_at_72%_10%,rgba(11,117,87,0.32),transparent_58%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_52%_48%_at_10%_85%,rgba(34,211,238,0.15),transparent_56%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_55%_42%_at_48%_52%,rgba(192,132,252,0.08),transparent_62%)]"
          aria-hidden
        />

        <div className="relative z-10 home-content-grid [isolation:isolate]">
          <GlxyHeroLogoVideo heroLogoSrc={heroLogoSrc} homeHlsSrc={homeHlsSrc ?? null} />

          <div className="mt-10 border-t border-white/10 pt-8 sm:mt-12 sm:pt-10 md:mt-14 md:pt-11">
            <GlxyStationListenStrip stations={stations} colorOverrides={stationColors} />
          </div>
        </div>
      </section>

      <section className="relative flex-1 overflow-x-hidden bg-gradient-to-b from-[#dce6ef] via-[#d5e0ea] to-[#cad8e6] pt-8 md:pt-10 pb-12 md:pb-16">
        {showProgrammingRow ? (
          <div className="home-content-grid pb-6 md:pb-8">
            <div
              className={splitAlignStrip ? "kiss-jp-prog-row" : "flex flex-col gap-4 md:gap-5"}
              style={splitAlignStrip ? ({ ["--kiss-station-n" as string]: String(stationGridN) } as CSSProperties) : undefined}
            >
              {showJp ? (
                <div className="flex min-h-[220px] min-w-0 flex-1 flex-col lg:min-h-[300px]">
                  <RecentTracksPanel
                    limit={justPlayedUi.recentTracksDisplayLimit}
                    panelTitle={copy.recentTracksTitle}
                    historyLinkLabel={copy.recentTracksCta}
                        stations={stations.map((s) => ({ id: s.id, line1: s.line1, logoUrl: s.logoUrl ?? null }))}
                    justPlayedUi={justPlayedUi}
                  />
                </div>
              ) : null}
              {showProg ? (
                <div className={`flex min-h-[220px] min-w-0 flex-1 flex-col lg:min-h-[300px] ${splitAlignStrip ? "kiss-jp-prog-span" : ""}`}>
                  <HomeProgrammingSchedule
                    slots={programmingSlots}
                    temporarySlots={programmingTemporarySlots}
                    liveBadgeText={copy.liveLabel}
                    panelTitle={copy.currentShowTitle}
                    justPlayedUi={justPlayedUi}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="home-content-grid">
          <div className="grid lg:grid-cols-[1fr_290px] xl:grid-cols-[1fr_320px] gap-6 md:gap-8 xl:gap-8 items-start">
            <div className="min-w-0 flex flex-col gap-6 md:gap-8">
              {copy.showConcertsPanel ? <ConcertsPanel sectionTitle={copy.concertsTitle} /> : null}
              {copy.showActionsPanel ? <ActionsPanel /> : null}
              {(copy.showInstagramPanel || copy.showTikTokPanel) ? (
                <div className="grid gap-6 md:gap-8 md:grid-cols-1 md:items-stretch">
                  {copy.showInstagramPanel ? (
                    <SocialProfilePanel
                      title={copy.instagramPanelTitle}
                      href={copy.instagramProfileUrl}
                      platform="instagram"
                      embedHtml={copy.instagramEmbedHtml}
                      postUrl={copy.instagramPostUrl}
                    />
                  ) : null}
                  {copy.showTikTokPanel ? (
                    <SocialProfilePanel
                      title={copy.tiktokPanelTitle}
                      href={copy.tiktokProfileUrl}
                      platform="tiktok"
                      embedHtml={copy.tiktokEmbedHtml}
                      postUrl={copy.tiktokPostUrl}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            {copy.showVoicesPanel ? (
              <VoicesSidebar
                title={copy.sidebarTitle}
                djs={djPhotos}
                maxItems={voicesCount}
              />
            ) : null}
          </div>
        </div>

        <AppDownloadPopup
          enabled={copy.showAppPopup}
          title={copy.appPopupTitle}
          body={copy.appPopupBody}
          cta={copy.appPopupCta}
          href={copy.appPopupUrl}
        />
      </section>
    </div>
  );
}
