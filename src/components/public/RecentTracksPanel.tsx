"use client";

import { useEffect, useState } from "react";
import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK, MOCK_RECENT_TRACKS_PAYLOAD } from "@/lib/mock/site";

function TrackThumb({ cover }: { cover: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [cover]);
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--fallback-album-bg, #f2f8fb)" }}>
      {cover && !failed ? (
        <AppImage src={cover} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} onError={() => setFailed(true)} />
      ) : (
        <AppImage
          src={MOCK_COVER_FALLBACK}
          alt=""
          className="h-full w-full max-h-[72%] object-contain p-[18%] opacity-90"
          loading="lazy"
          draggable={false}
        />
      )}
    </div>
  );
}

function formatTime(value: string | Date) {
  const d = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

export function RecentTracksPanel({
  limit = 5,
  className = "",
  panelTitle = "Laatste 5 tracks",
  historyLinkLabel = "Volledige geschiedenis",
}: {
  limit?: number;
  className?: string;
  panelTitle?: string;
  historyLinkLabel?: string;
}) {
  const tracks = MOCK_RECENT_TRACKS_PAYLOAD.tracks.slice(0, limit);

  return (
    <div
      className={`kiss-public-panel flex h-full min-w-0 w-full flex-col overflow-hidden rounded-3xl border border-solid border-[#1e375a]/12 bg-[#f2f8fb] shadow-[0_2px_16px_rgba(30,55,90,0.05)] ${className}`}
    >
      <div className={`flex shrink-0 items-center justify-between gap-3 ${KISS_PANEL_HEADER_BOX}`}>
        <p className={`${KISS_PANEL_TITLE} min-w-0`}>{panelTitle}</p>
        <a
          href="/playlist"
          className="text-brand-primary inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-black hover:underline"
        >
          {historyLinkLabel}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </a>
      </div>

      <div className={`${KISS_PANEL_BODY_PAD} flex min-h-0 flex-1 flex-col pt-0`}>
        <div className={`${KISS_PANEL_HEADER_GAP} flex min-h-0 flex-1 flex-col gap-2.5 md:gap-2`}>
          {tracks.length === 0 ? (
            <p className="text-sm font-medium text-gray-500">Nog geen tracks gelogd.</p>
          ) : (
            tracks.map((t) => (
              <a
                key={t.id}
                href="/playlist"
                className="kiss-public-track-row flex min-h-0 items-center gap-2 rounded-2xl border border-[#1e375a]/08 bg-white/90 px-2.5 py-2.5 md:flex-1 md:gap-2.5 md:px-3 md:py-3"
                aria-label={`Ga naar playlist voor ${t.title} van ${t.artist}`}
              >
                <div className="w-9 shrink-0 text-[11px] font-black tabular-nums leading-none text-gray-500 md:w-10 md:text-xs">
                  {formatTime(t.playedAt)}
                </div>
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-black/5 md:h-[3.25rem] md:w-[3.25rem]">
                  <TrackThumb cover={t.cover} />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-[15px] font-black leading-tight text-gray-900 md:text-base">{t.title}</p>
                  <p className="mt-0.5 truncate text-xs font-bold text-gray-600 md:text-[13px]">{t.artist}</p>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
