"use client";

import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";
import AppImage from "@/components/AppImage";
import { MOCK_CURRENT_SHOW_PAYLOAD, MOCK_COVER_FALLBACK } from "@/lib/mock/site";

export function CurrentShowPanel({
  className = "",
  panelTitle = "Nu op zender",
  scheduleCta = "Volledige programmering",
}: {
  className?: string;
  panelTitle?: string;
  scheduleCta?: string;
}) {
  const data = MOCK_CURRENT_SHOW_PAYLOAD;
  const hasData = Boolean(data?.found);
  const imagePath = hasData ? data?.jock?.imagePath : null;

  return (
    <div
      className={`kiss-public-panel flex h-full min-w-0 w-full flex-col overflow-hidden rounded-3xl border border-solid border-[#1e375a]/14 bg-[#f2f8fb] shadow-[0_2px_16px_rgba(30,55,90,0.06)] ${className}`}
    >
      <div className={`flex min-w-0 shrink-0 items-center justify-between gap-3 ${KISS_PANEL_HEADER_BOX}`}>
        <p className={`${KISS_PANEL_TITLE} min-w-0`}>{panelTitle}</p>
        <a
          href="/programmering"
          className="text-brand-primary inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-black hover:underline"
        >
          {scheduleCta}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </a>
      </div>

      <a
        href="/programmering"
        className="flex min-h-0 min-w-0 flex-1 flex-col rounded-b-3xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#37bfbf] focus-visible:ring-inset"
        aria-label="Ga naar programmering"
      >
        <div className={`px-5 ${KISS_PANEL_HEADER_GAP}`}>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#1e375a]/10 bg-[#e8eef5] shadow-inner">
            {imagePath ? (
              <AppImage src={imagePath} alt={data?.jock?.name || ""} className="h-full w-full object-cover object-center" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-5" style={{ backgroundColor: "#1e375a" }}>
                <AppImage src={MOCK_COVER_FALLBACK} alt="GLXY Radio" className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>
            )}
          </div>
        </div>

        <div className={`min-w-0 ${KISS_PANEL_BODY_PAD} ${KISS_PANEL_HEADER_GAP} pt-0`}>
          <p className="line-clamp-2 text-lg font-black leading-tight text-gray-900">
            {hasData ? data.label : "Programma-info volgt"}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-gray-600">{hasData ? `${data.jock.name} • ${data.time}` : ""}</p>
        </div>
      </a>
    </div>
  );
}
