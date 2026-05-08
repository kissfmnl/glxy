import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";

export const dynamic = "force-dynamic";

function fallbackLogoSrc() {
  return `/api/assets/Website/Logo/${encodeURIComponent("KISS BLAUW 5000 X 5000.png.png")}`;
}

export default async function DJsPage() {
  const [jocks, subtitleRow] = await Promise.all([
    prisma.jock.findMany({
      where: {
        isActive: true,
        NOT: [
          { name: { equals: "nonstop", mode: "insensitive" } },
          { name: { equals: "non-stop", mode: "insensitive" } },
          { name: { equals: "kiss nonstop", mode: "insensitive" } },
          { name: { equals: "kiss non-stop", mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, imagePath: true, imageFocusX: true, imageFocusY: true, cardQuote: true, bioText: true },
    }),
    prisma.siteSetting.findUnique({
      where: { key: "DJS_SUBTITLE" },
      select: { value: true },
    }),
  ]);
  const subtitle = subtitleRow?.value || "Onze jocks.";

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--brand-navy)" }}>
          DJ’s
        </h1>
        <p className="mt-3 text-gray-600 max-w-2xl">{subtitle}</p>
      </div>

      {jocks.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-[#cfdeeb] bg-[#f4f8fb] p-6">
          <p className="text-sm font-bold text-gray-700">Nog geen DJ’s toegevoegd.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-[#d3dae4] bg-[#eef2f6] p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {jocks.map((j) => {
              const hasBio = Boolean(j.bioText?.trim());
              const quote = j.cardQuote?.trim() || null;
              const tagline = hasBio ? quote || "Bekijk meer" : quote;
              const focusY = Math.max(18, Math.min(100, j.imageFocusY + 8));
              const inner = (
                <>
                  <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden bg-black/5 border border-black/5">
                    {j.imagePath ? (
                      <img
                        src={"/api/assets/" + j.imagePath.split("/").map(encodeURIComponent).join("/")}
                        alt={j.name}
                        className="h-full w-full object-cover scale-[1.06] transition-transform duration-300 group-hover:scale-[1.1]"
                        style={{ objectPosition: `${j.imageFocusX}% ${focusY}%` }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-5" style={{ backgroundColor: "#1e375a" }}>
                        <img src={fallbackLogoSrc()} alt="KISS FM" className="w-full h-full object-contain" loading="lazy" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-lg font-black text-gray-900 truncate">{j.name}</div>
                  {tagline ? (
                    <p
                      className={`mt-2 text-xs font-bold inline-flex items-center gap-1.5 ${hasBio ? "text-[#37bfbf]" : "text-gray-500"}`}
                    >
                      <span className="line-clamp-2">{tagline}</span>
                      {hasBio ? (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
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
                <div
                  key={j.id}
                  className="group kiss-public-panel cursor-default rounded-3xl border border-[#d1d9e5] bg-white p-5"
                  aria-label={j.name}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

