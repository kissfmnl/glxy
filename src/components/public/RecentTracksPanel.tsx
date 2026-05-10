"use client";

import { useEffect, useMemo, useState } from "react";
import { KISS_PANEL_BODY_PAD } from "@/lib/publicPanelChrome";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK } from "@/lib/mock/site";
import type { StationPlayEntry } from "@/lib/stationPlayHistory";
import { mergeJustPlayedConfig, type PublicJustPlayedConfig } from "@/lib/justPlayedConfig";

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
          className="h-full w-full max-h-[70%] object-contain p-2 opacity-90"
          loading="lazy"
          draggable={false}
        />
      )}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

type ApiPayload = {
  stations: Array<{ id: string; label: string }>;
  byStation: Record<string, StationPlayEntry[]>;
  merged: (StationPlayEntry & { stationId: string })[];
};

export function RecentTracksPanel({
  limit = 8,
  className = "",
  panelTitle = "JUST PLAYED",
  historyLinkLabel = "Open playlist",
  stations = [],
  justPlayedUi,
}: {
  limit?: number;
  className?: string;
  panelTitle?: string;
  historyLinkLabel?: string;
  /** Homepage-zenders voor filter (volgorde = zenderstrip). */
  stations?: Array<{ id: string; line1: string }>;
  /** Titelblok-kleuren (admin); default GLXY-geel / zwart. */
  justPlayedUi?: PublicJustPlayedConfig | null;
}) {
  const titlePalette = mergeJustPlayedConfig(justPlayedUi ?? null);
  const [data, setData] = useState<ApiPayload | null>(null);
  const [stationFilter, setStationFilter] = useState<string>("");

  const load = async () => {
    try {
      const r = await fetch("/api/public/just-played", { cache: "no-store" });
      const j = (await r.json()) as ApiPayload;
      if (j && typeof j === "object") setData(j);
    } catch {
      setData(null);
    }
  };

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 25_000);
    return () => window.clearInterval(t);
  }, []);

  const stationTabs = useMemo(() => {
    const fromStrip = stations.map((s) => ({ id: s.id, label: s.line1 }));
    const ids = new Set(fromStrip.map((s) => s.id));
    if (data?.stations) {
      for (const s of data.stations) {
        if (!ids.has(s.id)) fromStrip.push({ id: s.id, label: s.label });
      }
    }
    return fromStrip;
  }, [stations, data]);

  useEffect(() => {
    if (!data?.stations?.length || stationTabs.length === 0) return;
    const preferred = stations[0]?.id;
    const fallback = data.stations[0]!.id;
    const pick = preferred && stationTabs.some((s) => s.id === preferred) ? preferred : fallback;
    setStationFilter((prev) => (prev && stationTabs.some((s) => s.id === prev) ? prev : pick));
  }, [data, stations, stationTabs]);

  const rows = useMemo(() => {
    if (!data?.stations?.length || !stationFilter) return [];
    return (data.byStation[stationFilter] ?? []).slice(0, limit);
  }, [data, stationFilter, limit]);

  return (
    <div
      className={`kiss-public-panel font-sans flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-xl border border-solid border-[#1e375a]/12 bg-[#f2f8fb] shadow-[0_2px_12px_rgba(30,55,90,0.05)] ${className}`}
    >
      <div className="shrink-0 px-4 pb-2 pt-3">
        <div
          className="inline-flex max-w-full select-none rounded-md px-3 py-1.5"
          style={{ backgroundColor: titlePalette.titleBgHex, color: titlePalette.titleTextHex }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{panelTitle}</span>
        </div>
      </div>

      <div className={`${KISS_PANEL_BODY_PAD} flex min-h-0 flex-1 flex-col pt-0 !px-4 !pb-4`}>
        {stationTabs.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1" role="tablist" aria-label="Zender">
            {stationTabs.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={stationFilter === s.id}
                onClick={() => setStationFilter(s.id)}
                className={`max-w-[min(100%,11rem)] truncate rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wide transition-colors sm:text-[10px] ${
                  stationFilter === s.id
                    ? "bg-[var(--brand-primary)] text-[#0a0f0c] shadow-sm"
                    : "border border-[#1e375a]/15 bg-white/90 text-gray-600 hover:border-[var(--brand-primary)]/40"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="kiss-public-panel-scroll min-h-0 flex-1 overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col gap-1">
            {rows.length === 0 ? (
              <p className="py-3 text-center text-[11px] font-semibold text-gray-500">
                Nog geen tracks gelogd — metadata verschijnt zodra listeners nu-speelt ophalen.
              </p>
            ) : (
              rows.map((t) => {
                const entry = t as StationPlayEntry & { stationId?: string };
                return (
                  <div
                    key={`${entry.stationId ?? "x"}-${entry.id}-${entry.playedAt}`}
                    className="kiss-public-track-row flex items-start gap-2 rounded-lg border border-[#1e375a]/08 bg-white/95 px-2 py-1"
                  >
                    <div className="w-[34px] shrink-0 pt-0.5 text-[9px] font-black tabular-nums leading-none text-gray-500 sm:text-[10px]">
                      {formatTime(entry.playedAt)}
                    </div>
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-black/5 bg-black/5">
                      <TrackThumb cover={entry.coverUrl} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-[12px] font-black uppercase leading-snug tracking-wide text-gray-900 line-clamp-2">
                        {entry.title}
                      </p>
                      <p className="mt-0.5 break-words text-[10px] font-semibold uppercase tracking-wide text-gray-600 line-clamp-2">
                        {entry.artist}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-2 shrink-0 border-t border-[#1e375a]/10 pt-2">
          <a
            href="/playlist"
            className="text-brand-primary inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide hover:underline sm:text-[11px]"
          >
            {historyLinkLabel}
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
