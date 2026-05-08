"use client";

import useSWR from "swr";
import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fallbackLogoSrc() {
  return `/api/assets/Website/Logo/${encodeURIComponent("KISS BLAUW 5000 X 5000.png.png")}`;
}

export function CurrentShowPanel({
  className = "",
  panelTitle = "Nu op zender",
  scheduleCta = "Volledige programmering",
}: {
  className?: string;
  panelTitle?: string;
  scheduleCta?: string;
}) {
  const { data } = useSWR("/api/current-show", fetcher, { refreshInterval: 60_000 });
  const hasData = Boolean(data?.found);
  const imagePath = hasData ? data?.jock?.imagePath : null;

  return (
    <div
      className={`kiss-public-panel w-full min-w-0 h-full rounded-3xl border border-solid border-[#1e375a]/14 bg-[#f2f8fb] overflow-hidden flex flex-col shadow-[0_2px_16px_rgba(30,55,90,0.06)] ${className}`}
    >
      <div className={`flex items-center justify-between gap-3 min-w-0 shrink-0 ${KISS_PANEL_HEADER_BOX}`}>
        <p className={`${KISS_PANEL_TITLE} min-w-0`}>{panelTitle}</p>
        <a
          href="/programmering"
          className="text-xs font-black text-brand-primary hover:underline inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
        >
          {scheduleCta}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </a>
      </div>

      <a
        href="/programmering"
        className="flex flex-col flex-1 min-h-0 min-w-0 text-left rounded-b-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#37bfbf] focus-visible:ring-inset"
        aria-label="Ga naar programmering"
      >
        <div className={`px-5 ${KISS_PANEL_HEADER_GAP}`}>
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-[#1e375a]/10 bg-[#e8eef5] shadow-inner">
            {imagePath ? (
              <img
                src={"/api/assets/" + imagePath.split("/").map(encodeURIComponent).join("/")}
                alt={data?.jock?.name || ""}
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-5" style={{ backgroundColor: "#1e375a" }}>
                <img src={fallbackLogoSrc()} alt="KISS FM" className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>
            )}
          </div>
        </div>

        <div className={`min-w-0 ${KISS_PANEL_BODY_PAD} ${KISS_PANEL_HEADER_GAP} pt-0`}>
          <p className="text-lg font-black text-gray-900 leading-tight line-clamp-2">
            {hasData ? data.label : "Programma-info volgt"}
          </p>
          <p className="mt-1 text-sm font-bold text-gray-600 truncate">{hasData ? `${data.jock.name} • ${data.time}` : ""}</p>
        </div>
      </a>
    </div>
  );
}
