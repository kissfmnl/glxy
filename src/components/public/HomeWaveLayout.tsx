import type { CSSProperties } from "react";
import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";
import { NowNextCard } from "@/components/public/NowNextCard";
import { CurrentShowPanel } from "@/components/public/CurrentShowPanel";
import { RecentTracksPanel } from "@/components/public/RecentTracksPanel";
import { ConcertsPanel } from "@/components/public/ConcertsPanel";
import { ActionsPanel } from "@/components/public/ActionsPanel";
import { SocialProfilePanel } from "@/components/public/SocialProfilePanel";
import { AppDownloadPopup } from "@/components/public/AppDownloadPopup";
import { HomeHeroSubtitle } from "@/components/public/HomeHeroSubtitle";
import { HomeHeroBackdrop } from "@/components/public/HomeHeroBackdrop";
import { heroTitleColorStyle } from "@/lib/heroTitleColor";
import type { HeroTitleLayout, HomeWaveCopy } from "@/lib/homePageWaveCopy";
import { PUBLIC_PAGE_INTRO } from "@/lib/publicPageLayout";

function kissLipsSrc() {
  return `/api/assets/Website/Logo/${encodeURIComponent("KISS - Lippen (groen)_transparant (1) (4).png")}`;
}

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

function HeroHeadline({
  part1,
  part1Color,
  part2,
  part2Color,
  layout,
  hasKickerAbove,
}: {
  part1: string;
  part1Color: string;
  part2: string;
  part2Color: string;
  layout: HeroTitleLayout;
  hasKickerAbove: boolean;
}) {
  const c1 = heroTitleColorStyle(part1Color);
  const c2 = heroTitleColorStyle(part2Color);
  const top = hasKickerAbove ? "mt-3" : "mt-0";
  if (layout === "stacked") {
    return (
      <h1 className={`${top} text-3xl sm:text-4xl md:text-5xl font-black leading-[1.08] tracking-tight drop-shadow-sm`}>
        <span className="block whitespace-pre-line" style={c1.style}>
          {part1}
        </span>
        {part2 ? (
          <span className="block mt-1 sm:mt-1.5 whitespace-pre-line" style={c2.style}>
            {part2}
          </span>
        ) : null}
      </h1>
    );
  }
  return (
    <h1 className={`${top} text-3xl sm:text-4xl md:text-5xl font-black leading-[1.08] tracking-tight drop-shadow-sm`}>
      <span className="whitespace-pre-line" style={c1.style}>
        {part1}
      </span>
      {part2 ? (
        <>
          {" "}
          <span className="whitespace-pre-line" style={c2.style}>
            {part2}
          </span>
        </>
      ) : null}
    </h1>
  );
}

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

function PolaroidStrip({ items }: { items: HomeImageTile[] }) {
  if (items.length === 0) return null;
  const rotations = [-5, 3, -2, 4, -3, 2, -4, 3, -2, 5, -3, 2, -4, 3];
  return (
    <div className="relative my-5 md:my-7 w-screen max-w-[100vw] left-1/2 -translate-x-1/2">
      <div
        className="touch-pan-x overflow-x-auto overflow-y-visible overscroll-x-contain py-5 md:py-6 pl-10 pr-16 scroll-pl-4 snap-x snap-mandatory [scrollbar-color:rgba(255,255,255,0.28)_transparent] scrollbar-thin md:pl-24 md:pr-32 lg:pl-32 lg:pr-40 [-webkit-overflow-scrolling:touch]"
        style={POLAROID_FADE_MASK}
      >
        <div className="flex w-max gap-4 md:gap-6">
          {items.map((t, i) => (
            <div
              key={`${t.src}-p-${i}`}
              className="snap-center shrink-0 first:ml-0.5"
              style={{ transform: `rotate(${rotations[i % rotations.length]}deg)` }}
            >
              <div className="w-[154px] sm:w-[172px] md:w-[180px] bg-white p-2.5 pb-6 rounded-[2px] shadow-[0_14px_40px_rgba(0,0,0,0.45)] border border-white/90 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300">
                <div className="aspect-square overflow-hidden rounded-[1px] bg-white">
                  <img
                    src={t.src}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `${t.focalX ?? 50}% ${t.focalY ?? 50}%` }}
                    loading="lazy"
                  />
                </div>
                <p className="mt-2.5 text-[11px] font-black text-center text-[#1e375a] leading-tight line-clamp-2 px-0.5">{t.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
              <img
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
}: {
  copy: HomeWaveCopy;
  heroBackdropSlides: { src: string }[];
  trackCovers?: HomeImageTile[];
  djPhotos?: HomeImageTile[];
}) {
  const polaroids = uniqueBySrc(trackCovers, 14);
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
            <div className="flex flex-row items-start gap-4 sm:gap-5 md:items-center md:gap-8">
              <div className="min-w-0 flex-1 flex flex-col">
                {copy.showHeroKicker ? (
                  <p
                    className={`text-[11px] font-black tracking-[0.35em] uppercase ${
                      copy.heroKicker.trim() ? "text-[#7fe8e8]" : "text-transparent pointer-events-none select-none"
                    }`}
                    aria-hidden={!copy.heroKicker.trim()}
                  >
                    {copy.heroKicker.trim() ? copy.heroKicker : "\u00a0"}
                  </p>
                ) : null}
                <HeroHeadline
                  hasKickerAbove={copy.showHeroKicker}
                  part1={copy.heroTitle1}
                  part1Color={copy.heroTitle1Color}
                  part2={copy.heroTitle2}
                  part2Color={copy.heroTitle2Color}
                  layout={copy.heroTitleLayout}
                />
                <HomeHeroSubtitle text={copy.heroSubtitle} />
              </div>
              {copy.showLipsLogo ? (
                <div className="shrink-0 flex translate-y-1 items-center justify-center self-start max-md:-translate-y-0.5 max-md:-mr-2 sm:translate-y-1.5 md:mr-0">
                  <img
                    src={kissLipsSrc()}
                    alt=""
                    className="h-14 w-auto sm:h-[4.5rem] md:h-28 lg:h-[7.75rem] object-contain drop-shadow-lg opacity-95"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {copy.showPolaroids ? <PolaroidStrip items={polaroids} /> : null}

          <div className="mt-10 md:mt-12">
            <NowNextCard
              withPlayer
              variant="hero"
              disableCardHover
              labels={{
                nowPlaying: copy.nowLabel,
                nextPlaying: copy.nextLabel,
                live: copy.liveLabel,
              }}
            />
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
