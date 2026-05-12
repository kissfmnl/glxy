"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK } from "@/lib/mock/site";
import type { StationPlayEntry } from "@/lib/stationPlayHistory";
import { mergeJustPlayedConfig, type PublicJustPlayedConfig } from "@/lib/justPlayedConfig";
import { GlxyHomePanelHeading } from "@/components/public/GlxyHomePanelHeading";

function TrackThumb({ cover, stationLogo }: { cover: string | null | undefined; stationLogo?: string | null }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setCoverFailed(false);
    setLogoFailed(false);
  }, [cover, stationLogo]);

  const bg = "#0a0f18";

  if (cover && String(cover).trim() && !coverFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: bg }}>
        <AppImage
          src={cover}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
          onError={() => setCoverFailed(true)}
        />
      </div>
    );
  }

  if (stationLogo && String(stationLogo).trim() && !logoFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center p-1.5" style={{ backgroundColor: bg }}>
        <AppImage
          src={stationLogo}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
          draggable={false}
          onError={() => setLogoFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: bg }}>
      <AppImage
        src={MOCK_COVER_FALLBACK}
        alt=""
        className="h-full w-full max-h-[62%] object-contain p-1.5 opacity-55"
        loading="lazy"
        draggable={false}
      />
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
  stations: Array<{ id: string; label: string; logoUrl?: string | null }>;
  byStation: Record<string, StationPlayEntry[]>;
  merged: (StationPlayEntry & { stationId: string })[];
};

function trackKey(e: { artist: string; title: string }) {
  return `${e.artist.trim().toLowerCase()}||${e.title.trim().toLowerCase()}`;
}

export function RecentTracksPanel({
  limit = 10,
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
  stations?: Array<{ id: string; line1: string; logoUrl?: string | null }>;
  justPlayedUi?: PublicJustPlayedConfig | null;
}) {
  const theme = mergeJustPlayedConfig(justPlayedUi ?? null);
  const displayLimit = Math.min(50, Math.max(1, limit));
  const [data, setData] = useState<ApiPayload | null>(null);
  const [stationFilter, setStationFilter] = useState<string>("");
  const [extraCovers, setExtraCovers] = useState<Record<string, string>>({});
  const extraCoversRef = useRef<Record<string, string>>({});
  extraCoversRef.current = extraCovers;

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
    const fromStrip = stations.map((s) => ({ id: s.id, label: s.line1, logoUrl: s.logoUrl ?? null }));
    const ids = new Set(fromStrip.map((s) => s.id));
    if (data?.stations) {
      for (const s of data.stations) {
        if (!ids.has(s.id)) fromStrip.push({ id: s.id, label: s.label, logoUrl: s.logoUrl ?? null });
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

  const activeStationLogo = stationTabs.find((s) => s.id === stationFilter)?.logoUrl ?? null;

  const rows = useMemo(() => {
    if (!data?.stations?.length || !stationFilter) return [];
    return (data.byStation[stationFilter] ?? []).slice(0, displayLimit);
  }, [data, stationFilter, displayLimit]);

  useEffect(() => {
    let cancelled = false;
    const need = rows.filter((r) => {
      if (r.coverUrl && String(r.coverUrl).trim()) return false;
      if (!r.title.trim() && !r.artist.trim()) return false;
      const k = trackKey(r);
      return !extraCoversRef.current[k];
    });
    if (need.length === 0) return;
    void Promise.all(
      need.map(async (r) => {
        const k = trackKey(r);
        try {
          const qs = new URLSearchParams({ artist: r.artist, title: r.title });
          const res = await fetch(`/api/cover-art?${qs.toString()}`);
          const j = (await res.json()) as { url?: string };
          if (cancelled || !j?.url) return;
          setExtraCovers((prev) => (prev[k] ? prev : { ...prev, [k]: j.url! }));
        } catch {
          /* ignore */
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [rows]);

  return (
    <div
      className={`kiss-public-panel font-sans flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-xl border sm:rounded-2xl ${className}`}
      style={{
        background: `linear-gradient(180deg, #0a101c 0%, ${theme.panelSurfaceHex} 45%, #05070d 100%)`,
        borderColor: theme.panelBorderHex,
        boxShadow: "0 18px 50px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <GlxyHomePanelHeading title={panelTitle.toUpperCase()} theme={theme} />

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-0 sm:px-3.5 sm:pb-3.5">
        {stationTabs.length > 0 ? (
          <div
            className="mb-2 flex flex-wrap gap-1 rounded-lg p-1 ring-1 ring-white/[0.06] sm:mb-2.5"
            style={{ backgroundColor: theme.stationTabInactiveBgHex }}
            role="tablist"
            aria-label="Zender"
          >
            {stationTabs.map((s) => {
              const selected = stationFilter === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setStationFilter(s.id)}
                  className="max-w-[min(100%,11rem)] truncate rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 sm:px-3 sm:text-[11px]"
                  style={
                    selected
                      ? {
                          backgroundColor: theme.stationTabSelectedBgHex,
                          color: theme.stationTabSelectedTextHex,
                          boxShadow: `inset 0 -2px 0 0 ${theme.sectionAccentHex}`,
                        }
                      : {
                          color: "#94a3b8",
                        }
                  }
                >
                  {s.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="kiss-public-panel-scroll min-h-0 flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col gap-1.5">
            {rows.length === 0 ? (
              <p className="rounded-lg border border-[#1e293b] bg-[#101822] px-3 py-5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Nog geen tracks gelogd.
              </p>
            ) : (
              rows.map((t) => {
                const entry = t as StationPlayEntry & { stationId?: string };
                const resolvedCover = entry.coverUrl?.trim() || extraCovers[trackKey(entry)] || null;
                return (
                  <div
                    key={`${entry.stationId ?? "x"}-${entry.id}-${entry.playedAt}`}
                    className="group flex items-center gap-2.5 rounded-lg border border-[#1e293b] bg-[#101822] px-2 py-2 transition-all duration-200 hover:-translate-y-px hover:border-white/[0.12] hover:shadow-[0_8px_28px_rgba(0,0,0,0.55),0_0_0_1px_rgba(11,117,87,0.25)] sm:gap-3 sm:px-2.5 sm:py-2"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md shadow-inner ring-1 ring-black/40 sm:h-12 sm:w-12 sm:rounded-lg">
                      <TrackThumb cover={resolvedCover} stationLogo={activeStationLogo} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[12px] font-bold uppercase leading-snug tracking-wide text-white sm:text-[13px]">
                        {entry.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">
                        {entry.artist}
                      </p>
                    </div>
                    <time
                      dateTime={entry.playedAt}
                      className="shrink-0 text-right font-mono text-[10px] tabular-nums tracking-wide text-slate-500"
                    >
                      {formatTime(entry.playedAt)}
                    </time>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-2.5 shrink-0 border-t pt-2.5" style={{ borderColor: theme.panelBorderHex }}>
          <a
            href="/playlist"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] transition hover:brightness-110 sm:text-[11px]"
            style={{ color: theme.playlistLinkHex }}
          >
            {historyLinkLabel.toUpperCase()}
            <svg className="h-3.5 w-3.5 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
