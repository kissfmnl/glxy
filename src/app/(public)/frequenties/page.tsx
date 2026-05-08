import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import { FrequentiesCoverageMap } from "@/components/public/FrequentiesCoverageMap";
import AppImage from "@/components/AppImage";

/** Altijd uit DB lezen (uploads in admin), niet bij build vastzetten met fallback-badges. */
export const dynamic = "force-dynamic";

const APP_STORE_URL = "https://apps.apple.com/nl/app/kiss-fm/id6745023093";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=kissfm.APPLICATION";

const DEFAULT_LINES = [
  "Amsterdam - 93.6 FM",
  "Haarlem - 97.3 FM",
  "Alkmaar - 96.3 FM",
  "Wieringermeer - 96.0 FM",
  "Almere - 97.4 FM",
  "Lelystad - 89.4 FM",
  "Emmeloord - 97.5 FM",
];

const DEFAULT_FM_TITLE = "Op FM en DAB+";
const DEFAULT_SUBTITLE =
  "Via de website en onze app heb je ons altijd bij je. Gratis te downloaden via de App Store en Google Play. Ook op DAB+ zijn we in heel Nederland te horen. En natuurlijk via FM in de Randstad.";
const DEFAULT_APP_TITLE = "Luister overal ter wereld";
const DEFAULT_APP_BODY =
  "Download de gratis KISS FM-app voor iPhone en Android en neem ons mee, waar je ook bent — streamen via internet of de app.";

/** Standaard + optionele admin-upload via /api/frequenties-image (Website/Appstore.png enz.). */
const FREQ_IMG = (slot: "ios" | "android" | "map") => `/api/frequenties-image?slot=${slot}`;

export default async function FrequentiesPage() {
  let fmPanelTitle = DEFAULT_FM_TITLE;
  let subtitle = DEFAULT_SUBTITLE;
  let freqLines: string[] = DEFAULT_LINES;
  let appTitle = DEFAULT_APP_TITLE;
  let appBody = DEFAULT_APP_BODY;
  try {
    const keys = [
      "FREQUENTIES_FM_PANEL_TITLE",
      "FREQUENTIES_SUBTITLE",
      "FREQUENTIES_LINES",
      "FREQUENTIES_APP_TITLE",
      "FREQUENTIES_APP_BODY",
    ] as const;
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: [...keys] } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const fm = map.get("FREQUENTIES_FM_PANEL_TITLE")?.trim();
    if (fm) fmPanelTitle = fm;
    const sub = map.get("FREQUENTIES_SUBTITLE")?.trim();
    if (sub) subtitle = sub;
    const raw = (map.get("FREQUENTIES_LINES") || "").trim();
    if (raw) {
      freqLines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    }
    const at = map.get("FREQUENTIES_APP_TITLE")?.trim();
    if (at) appTitle = at;
    const ab = map.get("FREQUENTIES_APP_BODY")?.trim();
    if (ab) appBody = ab;
  } catch {}

  const iosSrc = FREQ_IMG("ios");
  const androidSrc = FREQ_IMG("android");
  const coverageMapSrc = FREQ_IMG("map");

  /** Alleen de badge-afbeelding; subtiele hover. */
  const badgeSlot =
    "inline-flex shrink-0 items-center justify-center transition-[transform,opacity] duration-200 hover:opacity-[0.92] hover:scale-[1.02] active:scale-[0.99]";

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--brand-navy)" }}>
          Frequenties
        </h1>
      </div>

      <div className="mt-8 rounded-3xl border border-[#d3dae4] bg-[#eef2f6] p-4 md:p-6 shadow-sm">
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
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={`${badgeSlot} flex min-w-0 shrink-0 justify-start`}
                >
                  <AppImage
                    src={iosSrc}
                    alt="Download in de App Store"
                    className="h-11 w-auto max-w-full object-contain sm:h-12 md:h-[3.25rem] md:max-w-[12rem]"
                    loading="eager"
                    decoding="async"
                  />
                </a>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={`${badgeSlot} flex min-w-0 shrink-0 justify-start`}
                >
                  <AppImage
                    src={androidSrc}
                    alt="Ontdek het op Google Play"
                    className="h-11 w-auto max-w-full object-contain sm:h-12 md:h-[3.25rem] md:max-w-[12rem]"
                    loading="eager"
                    decoding="async"
                  />
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
