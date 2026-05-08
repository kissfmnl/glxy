import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import { FrequentiesCoverageMap } from "@/components/public/FrequentiesCoverageMap";
import { MOCK_HERO_BACKDROP_PATHS } from "@/lib/mock/site";

const fmPanelTitle = "Stream & DAB+ (demo)";
const subtitle =
  "GLXY Radio draait als statische demo. In productie zou je hier overlap tonen met FM / DAB+ / app — nu focussen we op de digitale ervaring.";
const freqLines = ["Digitale stream — wereldwijd", "DAB+ — fictieve multiplex GLXY-NL", "Smart speaker — zoek naar GLXY Radio"];
const appTitle = "Apps (placeholder-links)";
const appBody =
  "Gebruik de stream-knop op de site of voeg deze pagina toe aan je startscherm. App-store badges hieronder zijn decoratief.";

export default function FrequentiesPage() {
  const coverageMapSrc =
    MOCK_HERO_BACKDROP_PATHS[1] || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop";

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          Frequenties
        </h1>
      </div>

      <div className="mt-8 rounded-3xl border border-[#d3dae4] bg-[#eef2f6] p-4 shadow-sm md:p-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-stretch">
          <div className="flex min-h-0 min-w-0 flex-col gap-4">
            <div className="rounded-3xl border border-[#d1d9e5] bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-black tracking-tight text-[#1f3f62] md:text-xl">{fmPanelTitle}</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-gray-700">{subtitle}</p>
              <div className="mt-4 flex flex-col gap-1">
                {freqLines.map((item) => (
                  <p key={item} className="text-sm font-black leading-normal text-[#1f3f62]">
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#d1d9e5] bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-black tracking-tight text-[#1f3f62] md:text-xl">{appTitle}</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-gray-700">{appBody}</p>
              <div className="mt-5 flex flex-row flex-wrap items-center justify-start gap-3 md:gap-5">
                <a
                  href="#"
                  className="rounded-xl border border-[#1e375a]/20 bg-[#1e375a] px-4 py-2 text-xs font-black text-white"
                >
                  App Store (demo)
                </a>
                <a
                  href="#"
                  className="rounded-xl border border-[#1e375a]/20 bg-white px-4 py-2 text-xs font-black text-[#1e375a]"
                >
                  Google Play (demo)
                </a>
              </div>
            </div>
          </div>

          <FrequentiesCoverageMap src={coverageMapSrc} />
        </div>
      </div>
    </div>
  );
}
