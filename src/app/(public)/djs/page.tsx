import Link from "next/link";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK, MOCK_JOCKS } from "@/lib/mock/site";

const subtitle = "Demo-hosts voor GLXY Radio — fictieve profiles.";

export default function DJsPage() {
  const jocks = MOCK_JOCKS.map((j) => ({
    id: j.slug,
    name: j.name,
    slug: j.slug,
    imagePath: j.imagePath,
    imageFocusX: j.imageFocusX,
    imageFocusY: j.imageFocusY,
    cardQuote: "Stem op de cosmic countdown",
    bioText: `${j.name} draait de hits van de sterren.`,
  }));

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          Hosts
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">{subtitle}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-[#d3dae4] bg-[#eef2f6] p-4 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {jocks.map((j) => {
            const hasBio = Boolean(j.bioText?.trim());
            const quote = j.cardQuote?.trim() || null;
            const tagline = hasBio ? quote || "Bekijk meer" : quote;
            const focusY = Math.max(18, Math.min(100, j.imageFocusY + 8));
            const inner = (
              <>
                <div className="aspect-[4/5] w-full overflow-hidden rounded-3xl border border-black/5 bg-black/5">
                  {j.imagePath ? (
                    <AppImage
                      src={j.imagePath.startsWith("http") ? j.imagePath : MOCK_COVER_FALLBACK}
                      alt={j.name}
                      className="h-full w-full scale-[1.06] object-cover transition-transform duration-300 group-hover:scale-[1.1]"
                      style={{ objectPosition: `${j.imageFocusX}% ${focusY}%` }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-5" style={{ backgroundColor: "#1e375a" }}>
                      <AppImage src={MOCK_COVER_FALLBACK} alt="GLXY Radio" className="h-full w-full object-contain" loading="lazy" />
                    </div>
                  )}
                </div>
                <div className="mt-4 truncate text-lg font-black text-gray-900">{j.name}</div>
                {tagline ? (
                  <p
                    className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${hasBio ? "text-[#37bfbf]" : "text-gray-500"}`}
                  >
                    <span className="line-clamp-2">{tagline}</span>
                    {hasBio ? (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-5-5 5 5-5 5" />
                      </svg>
                    ) : null}
                  </p>
                ) : null}
              </>
            );
            return hasBio ? (
              <Link
                key={j.id}
                href={`/djs/${encodeURIComponent(j.slug)}`}
                className="group kiss-public-panel block rounded-3xl border border-[#d1d9e5] bg-white p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#37bfbf]"
              >
                {inner}
              </Link>
            ) : (
              <div key={j.id} className="group kiss-public-panel cursor-default rounded-3xl border border-[#d1d9e5] bg-white p-5" aria-label={j.name}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
