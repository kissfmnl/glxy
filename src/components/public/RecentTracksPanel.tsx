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

  const bg = "var(--jp-fallback-bg, #060a12)";

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
      <div className="flex h-full w-full items-center justify-center p-2" style={{ backgroundColor: bg }}>
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
        className="h-full w-full max-h-[65%] object-contain p-2 opacity-60"
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
      className={`kiss-public-panel font-sans relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-[1.35rem] border border-solid sm:rounded-3xl ${className}`}
      style={{
        background: `linear-gradient(165deg, color-mix(in srgb, ${theme.panelSurfaceHex} 92%, ${theme.sectionAccentHex}) 0%, ${theme.panelSurfaceHex} 42%, #050810 100%)`,
        borderColor: `${theme.panelBorderHex}80`,
        boxShadow: `0 4px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
        ["--jp-fallback-bg" as string]: "#060a12",
        ["--jp-accent" as string]: theme.sectionAccentHex,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        aria-hidden
      />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <GlxyHomePanelHeading title={panelTitle} theme={theme} />

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
          {stationTabs.length > 0 ? (
            <div
              className="mb-4 flex flex-wrap gap-1.5 rounded-2xl p-1.5 sm:mb-5"
              style={{
                backgroundColor: "rgba(0,0,0,0.35)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
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
                    className="max-w-[min(100%,12rem)] truncate rounded-xl px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 sm:text-xs"
                    style={
                      selected
                        ? {
                            background: `linear-gradient(135deg, color-mix(in srgb, ${theme.sectionAccentHex} 55%, #0f172a), ${theme.stationTabSelectedBgHex})`,
                            color: theme.stationTabSelectedTextHex,
                            boxShadow: `0 0 24px color-mix(in srgb, ${theme.sectionAccentHex} 45%, transparent), 0 4px 14px rgba(0,0,0,0.35)`,
                          }
                        : {
                            backgroundColor: "rgba(255,255,255,0.04)",
                            color: "rgba(226,232,240,0.55)",
                          }
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="kiss-public-panel-scroll min-h-0 flex-1 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
            <div className="flex flex-col gap-3 sm:gap-3.5">
              {rows.length === 0 ? (
                <p className="rounded-2xl bg-white/[0.03] px-4 py-8 text-center text-sm font-medium text-slate-400 backdrop-blur-sm">
                  Nog geen tracks gelogd — geschiedenis wordt server-side bijgewerkt.
                </p>
              ) : (
                rows.map((t) => {
                  const entry = t as StationPlayEntry & { stationId?: string };
                  const resolvedCover = entry.coverUrl?.trim() || extraCovers[trackKey(entry)] || null;
                  return (
                    <div
                      key={`${entry.stationId ?? "x"}-${entry.id}-${entry.playedAt}`}
                      className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl px-3 py-3 transition-all duration-300 sm:gap-4 sm:px-4 sm:py-3.5"
                      style={{
                        background: "linear-gradient(105deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.15) 100%)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background: `radial-gradient(120% 80% at 0% 50%, color-mix(in srgb, ${theme.sectionAccentHex} 18%, transparent), transparent 55%)`,
                        }}
                      />
                      <div className="relative h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.04] group-hover:ring-white/20 sm:h-[4rem] sm:w-[4rem] sm:rounded-2xl">
                        <TrackThumb cover={resolvedCover} stationLogo={activeStationLogo} />
                      </div>
                      <div className="relative min-w-0 flex-1">
                        <p className="line-clamp-2 text-[0.95rem] font-bold leading-snug tracking-tight text-white sm:text-base">
                          {entry.title}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-400 sm:text-[0.8125rem]">{entry.artist}</p>
                      </div>
                      <time
                        dateTime={entry.playedAt}
                        className="relative shrink-0 text-right font-mono text-[10px] tabular-nums tracking-wide text-slate-500 sm:text-[11px]"
                      >
                        {formatTime(entry.playedAt)}
                      </time>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="relative z-[1] mt-4 shrink-0 border-t border-white/[0.06] pt-4">
            <a
              href="/playlist"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] transition hover:brightness-110 sm:text-[13px]"
              style={{ color: theme.playlistLinkHex }}
            >
              {historyLinkLabel}
              <svg className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
