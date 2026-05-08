import { ArtistWall } from "@/components/public/ArtistWall";
import { HomePagePanelColumn } from "@/components/public/HomePagePanelColumn";

/** Originele homepage-indeling: linker kolom met panels, rechts de artiestenmuur. */
export function HomeClassicLayout() {
  return (
    <div className="relative flex-1 flex flex-col min-h-0 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 md:hidden bg-[radial-gradient(120%_70%_at_50%_0%,rgba(55,191,191,0.14),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0)_42%)]" />
      <section className="relative z-10 w-full min-w-0 max-w-full -mt-16 md:-mt-[4.5rem] pt-24 md:pt-28 px-4 md:px-8 overflow-x-hidden overflow-hidden">
        <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1500px] pb-7 md:pb-10">
          <div className="grid gap-8 lg:grid-cols-[560px_1fr] items-start lg:items-stretch relative min-h-0">
            <div className="relative z-20 flex flex-col lg:ml-8 xl:ml-12 min-w-0 w-full max-w-full">
              <HomePagePanelColumn />
            </div>

            <div className="hidden md:block relative z-0 -mr-8 md:-mr-[5.25rem] lg:-mr-[6.5rem] self-stretch min-h-0 min-w-0 overflow-x-visible overflow-y-visible">
              <div
                className="absolute -left-[7vw] lg:-left-24 right-0 top-[-9rem] lg:top-[-10rem] bottom-[-8rem] lg:bottom-[-12rem] overflow-hidden pointer-events-none"
                aria-hidden
              >
                <ArtistWall />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
