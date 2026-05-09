import type { CSSProperties } from "react";
import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";
import { CurrentShowPanel } from "@/components/public/CurrentShowPanel";
import { RecentTracksPanel } from "@/components/public/RecentTracksPanel";
import { ConcertsPanel } from "@/components/public/ConcertsPanel";
import { ActionsPanel } from "@/components/public/ActionsPanel";
import { SocialProfilePanel } from "@/components/public/SocialProfilePanel";
import { AppDownloadPopup } from "@/components/public/AppDownloadPopup";
import { HomeHeroBackdrop } from "@/components/public/HomeHeroBackdrop";
import { heroTitleColorStyle } from "@/lib/heroTitleColor";
import type { HeroTitleLayout, HomeWaveCopy } from "@/types/home-wave";
import { PUBLIC_PAGE_INTRO } from "@/lib/publicPageLayout";
import { HomeHlsEmbed } from "@/components/public/HomeHlsEmbed";
import AppImage from "@/components/AppImage";
import { GlxyStationSidebar } from "@/components/public/GlxyStationSidebar";

export type HomeImageTile = { src: string; alt: string; slug?: string; focalX?: number; focalY?: number };

function uniqueBySrc(tiles: HomeImageTile[], max: number): HomeImageTile[] {
  const seen = new Set<string>();
  const out: HomeImageTile[] = [];
  for (const t of tiles) {
    if (!t.src || seen.has(t.src)) continue;
    seen.add(t.src);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

// Hero headline removed per design (cleaner hero: zenders + video).

/** Alleen zachte fade rechts; volle dekking boven/onder (geen verticale uitfranje). */
const POLAROID_FADE_MASK: CSSProperties = {
  maskImage:
    "linear-gradient(to right, black 0%, black 86%, rgba(0,0,0,0.28) 93%, rgba(0,0,0,0.06) 98%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, black 0%, black 86%, rgba(0,0,0,0.28) 93%, rgba(0,0,0,0.06) 98%, transparent 100%)",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
};

// Polaroid strip removed per design.

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
}: {
  copy: HomeWaveCopy;
  heroBackdropSlides: { src: string }[];
  trackCovers?: HomeImageTile[];
  djPhotos?: HomeImageTile[];
  /** HLS .m3u8 URL for homepage live embed */
  homeHlsSrc?: string | null;
}) {
  const autoVoicesCount = copy.showInstagramPanel && copy.showTikTokPanel ? 4 : copy.showInstagramPanel || copy.showTikTokPanel ? 5 : 6;
  const voicesCount = copy.voicesPhotoCount ?? autoVoicesCount;

  return (
    <div className="relative flex-1 flex flex-col min-h-0 min-w-0 max-w-full w-full">
      <section className="relative z-10 -mt-16 md:-mt-[4.5rem] overflow-visible bg-[#0c1f33] pb-6 pt-24 shadow-[0_12px_40px_rgba(12,31,51,0.22)] sm:pb-8 md:pb-14 md:pt-28">
        <div className="absolute inset-0 overflow-hidden">
          <HomeHeroBackdrop slides={heroBackdropSlides} motionEnabled={copy.heroBackdropMotion} />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[#0c1f33]/40 sm:bg-[#0c1f33]/38"
          style={{
            WebkitBackdropFilter: "blur(10px)",
            backdropFilter: "blur(10px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#0c1f33]/72 via-[#142a45]/50 to-[#1e375a]/58"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_70%_42%_at_50%_0%,rgba(55,191,191,0.07),transparent_50%)]"
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-4 md:px-8 [isolation:isolate]">
          <div className={`min-w-0 ${PUBLIC_PAGE_INTRO}`}>
            {/* Mobiel: TV eerst (als aanwezig), dan zenders, dan kop. Desktop: zenders | kop | TV (sticky rechts). */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8 xl:gap-10">
              <div className="order-2 min-w-0 shrink-0 lg:order-1 lg:max-w-[280px] xl:max-w-[288px]">
                <GlxyStationSidebar />
              </div>

              {homeHlsSrc ? (
                <aside className="order-1 w-full lg:order-3 lg:sticky lg:top-[5.25rem] lg:z-20 lg:w-[min(100%,420px)] lg:min-w-[300px] lg:max-w-[440px] lg:shrink-0 xl:top-[5.5rem]">
                  <p className="mb-2 text-center text-[11px] font-black uppercase tracking-[0.28em] text-[#7fe8e8]/95 lg:text-right">
                    GLXY TV · Live meekijken
                  </p>
                  <HomeHlsEmbed compact src={homeHlsSrc} title="GLXY TV live video" className="shadow-[0_20px_60px_rgba(0,0,0,0.55)]" />
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex-1 overflow-x-hidden bg-gradient-to-b from-[#dce6ef] via-[#d5e0ea] to-[#cad8e6] pt-8 md:pt-10 pb-12 md:pb-16">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-4 md:px-8">
          <div className="grid lg:grid-cols-[1fr_290px] xl:grid-cols-[1fr_320px] gap-6 md:gap-8 xl:gap-8 items-start">
            <div className="min-w-0 flex flex-col gap-6 md:gap-8">
              {(copy.showCurrentShowPanel || copy.showRecentTracksPanel) ? (
                <div className="grid gap-6 md:gap-8 md:grid-cols-2 md:items-stretch">
                  {copy.showCurrentShowPanel ? (
                    <div className="min-w-0 flex flex-col min-h-0">
                      <CurrentShowPanel panelTitle={copy.currentShowTitle} scheduleCta={copy.currentShowCta} />
                    </div>
                  ) : null}
                  {copy.showRecentTracksPanel ? (
                    <div className="min-w-0 flex flex-col min-h-0">
                      <RecentTracksPanel
                        limit={5}
                        panelTitle={copy.recentTracksTitle}
                        historyLinkLabel={copy.recentTracksCta}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

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
