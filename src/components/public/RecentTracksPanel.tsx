"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KISS_PANEL_BODY_PAD } from "@/lib/publicPanelChrome";
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

  const bg = "var(--jp-fallback-bg, #0c1220)";

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
        className="h-full w-full max-h-[70%] object-contain p-2 opacity-75"
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
      className={`kiss-public-panel font-sans flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.25)] ${className}`}
      style={{
        backgroundColor: theme.panelSurfaceHex,
        borderColor: theme.panelBorderHex,
        ["--jp-fallback-bg" as string]: theme.panelSurfaceHex,
      }}
    >
      <GlxyHomePanelHeading title={panelTitle} theme={theme} />

      <div className={`${KISS_PANEL_BODY_PAD} flex min-h-0 flex-1 flex-col pt-0 !px-3 !pb-3 sm:!px-4 sm:!pb-3.5`}>
        {stationTabs.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1" role="tablist" aria-label="Zender">
            {stationTabs.map((s) => {
              const selected = stationFilter === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setStationFilter(s.id)}
                  className="max-w-[min(100%,10rem)] truncate rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors sm:text-[10px]"
                  style={
                    selected
                      ? {
                          backgroundColor: theme.stationTabSelectedBgHex,
                          color: theme.stationTabSelectedTextHex,
                          boxShadow: `inset 0 -2px 0 0 ${theme.sectionAccentHex}`,
                        }
                      : {
                          backgroundColor: theme.stationTabInactiveBgHex,
                          color: "rgba(255,255,255,0.72)",
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: theme.stationTabInactiveBorderHex,
                        }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="kiss-public-panel-scroll min-h-0 flex-1 overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col gap-1">
            {rows.length === 0 ? (
              <p className="py-4 text-center text-[11px] font-medium text-white/55">
                Nog geen tracks gelogd — geschiedenis wordt server-side bijgewerkt (ongeveer elke minuut).
              </p>
            ) : (
              rows.map((t) => {
                const entry = t as StationPlayEntry & { stationId?: string };
                const resolvedCover = entry.coverUrl?.trim() || extraCovers[trackKey(entry)] || null;
                return (
                  <div
                    key={`${entry.stationId ?? "x"}-${entry.id}-${entry.playedAt}`}
                    className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 backdrop-blur-[2px]"
                  >
                    <div className="w-9 shrink-0 text-[9px] font-medium tabular-nums leading-none text-white/55 sm:text-[10px]">
                      {formatTime(entry.playedAt)}
                    </div>
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/[0.08] bg-black/20">
                      <TrackThumb cover={resolvedCover} stationLogo={activeStationLogo} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-[11px] font-semibold uppercase leading-snug tracking-wide text-white line-clamp-2 sm:text-xs">
                        {entry.title}
                      </p>
                      <p className="mt-0.5 break-words text-[10px] font-medium uppercase tracking-wide text-white/75 line-clamp-2">
                        {entry.artist}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-2 shrink-0 border-t border-white/[0.06] pt-2">
          <a
            href="/playlist"
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] hover:underline sm:text-[11px]"
            style={{ color: theme.playlistLinkHex }}
          >
            {historyLinkLabel}
            <svg className="h-3 w-3 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
