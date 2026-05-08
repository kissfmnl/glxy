"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";
import AppImage from "@/components/AppImage";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function kissLipsSrc() {
  return "/api/fallback-album-logo";
}

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
        <AppImage src={kissLipsSrc()} alt="" className="h-full w-full max-h-[72%] object-contain opacity-90 p-[18%]" loading="lazy" draggable={false} />
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
  const { data } = useSWR(`/api/recent-tracks?limit=${limit}`, fetcher, {
    refreshInterval: 20_000,
  });

  const tracks = (data?.tracks as Array<any> | undefined) || [];

  return (
    <div
      className={`kiss-public-panel w-full min-w-0 h-full flex flex-col rounded-3xl border border-solid border-[#1e375a]/12 bg-[#f2f8fb] shadow-[0_2px_16px_rgba(30,55,90,0.05)] overflow-hidden ${className}`}
    >
      <div className={`flex items-center justify-between gap-3 shrink-0 ${KISS_PANEL_HEADER_BOX}`}>
        <p className={`${KISS_PANEL_TITLE} min-w-0`}>{panelTitle}</p>
        <a
          href="/playlist"
          className="text-xs font-black text-brand-primary hover:underline inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
        >
          {historyLinkLabel}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
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
                <div className="w-9 shrink-0 text-[11px] font-black text-gray-500 tabular-nums leading-none md:w-10 md:text-xs">
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

