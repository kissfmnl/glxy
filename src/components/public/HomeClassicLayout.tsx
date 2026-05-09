import { ArtistWall } from "@/components/public/ArtistWall";
import { HomePagePanelColumn } from "@/components/public/HomePagePanelColumn";
import { HomeHlsEmbed } from "@/components/public/HomeHlsEmbed";

/** Originele homepage: panels links, rechts GLXY TV (sticky) + artiestenmuur. */
export function HomeClassicLayout({ homeHlsSrc }: { homeHlsSrc?: string | null }) {
  return (
    <div className="relative flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 md:hidden bg-[radial-gradient(120%_70%_at_50%_0%,rgba(55,191,191,0.14),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0)_42%)]" />
      <section className="relative z-10 -mt-16 w-full min-w-0 max-w-full overflow-x-hidden overflow-hidden pt-24 md:-mt-[4.5rem] md:pt-28">
        <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1500px] px-4 pb-7 md:px-8 md:pb-10">
          {homeHlsSrc ? (
            <div className="mb-8 lg:hidden">
              <p className="mb-2 text-center text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600/95">GLXY TV · Live</p>
              <HomeHlsEmbed compact src={homeHlsSrc} title="GLXY TV live video" />
            </div>
          ) : null}

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,560px)_minmax(280px,420px)] lg:gap-10 xl:grid-cols-[minmax(0,620px)_minmax(300px,440px)]">
            <div className="relative z-20 min-w-0 lg:ml-4 xl:ml-12">
              <HomePagePanelColumn />
            </div>

            <div className="relative z-30 hidden min-w-0 flex-col gap-8 lg:flex lg:sticky lg:top-28 lg:self-start xl:top-[7rem]">
              {homeHlsSrc ? (
                <div>
                  <p className="mb-2 text-right text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600/95">
                    GLXY TV · Live meekijken
                  </p>
                  <HomeHlsEmbed compact src={homeHlsSrc} title="GLXY TV live video" />
                </div>
              ) : null}

              <div className="relative -mr-6 hidden min-h-[min(70vh,620px)] overflow-hidden md:-mr-[5rem] lg:block lg:min-h-[520px] xl:-mr-[6.5rem]">
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                  <ArtistWall />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
