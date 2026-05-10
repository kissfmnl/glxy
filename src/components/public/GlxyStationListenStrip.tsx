"use client";

import { useGlxyRadio } from "@/components/public/GlxyRadioProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import AppImage from "@/components/AppImage";
import type { GlxyStation } from "@/lib/glxyStations";

function StationLogoCompact({ station }: { station: GlxyStation }) {
  const initial = (station.line1?.trim()?.charAt(0) || station.id.charAt(1) || "?").toUpperCase();
  if (station.logoUrl) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/20 shadow-inner ring-1 ring-black/10 sm:h-11 sm:w-11">
        <AppImage
          src={station.logoUrl}
          alt=""
          width={256}
          height={256}
          sizes="44px"
          className="h-full w-full object-cover object-center"
          aria-hidden
          priority={false}
        />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/15 text-[11px] font-black uppercase tracking-tighter ring-1 ring-black/10 sm:h-11 sm:w-11">
      {initial}
    </div>
  );
}

function StationCardCompact({
  station,
  playing,
  onToggle,
  bgOverride,
  npTitle,
  npArtist,
  npLoading,
}: {
  station: GlxyStation;
  playing: boolean;
  onToggle: () => void;
  bgOverride?: string | null;
  npTitle: string;
  npArtist: string;
  npLoading: boolean;
}) {
  const hasNpUrl = !!(station.nowPlayingUrl?.trim());
  const titleLine = hasNpUrl ? npTitle || station.line1 : station.line1;
  const artistLine = hasNpUrl ? npArtist || station.line2 : station.line2;

  const playColor = station.playButtonHex?.trim() || undefined;

  const bgStyle =
    station.zebraPattern
      ? {
          backgroundImage:
            "repeating-linear-gradient(-52deg, rgba(0,0,0,0.06) 0 8px, transparent 8px 16px), linear-gradient(#facc15, #facc15)",
          ...(bgOverride ? { backgroundColor: bgOverride } : {}),
        }
      : bgOverride
        ? { backgroundColor: bgOverride }
        : undefined;

  return (
    <div
      className={`group relative flex min-h-[3.25rem] items-center gap-2 overflow-hidden rounded-md px-2 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:-translate-y-1 hover:brightness-[1.07] hover:shadow-[0_12px_32px_rgba(11,117,87,0.42)] active:scale-[0.99] sm:gap-x-2.5 sm:px-2.5 sm:py-2.5 ${station.cardClass}`}
      style={bgStyle}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <StationLogoCompact station={station} />
        <div className="min-w-0 flex-1">
          <p
            style={{ color: "var(--glxy-station-text)" }}
            className={`truncate text-[9px] font-black uppercase leading-tight tracking-wide sm:text-[10px] ${npLoading && hasNpUrl ? "animate-pulse opacity-80" : ""}`}
          >
            {titleLine}
          </p>
          <p
            style={{ color: "var(--glxy-station-subtext)" }}
            className={`truncate text-[8px] font-semibold uppercase leading-tight sm:text-[9px] ${npLoading && hasNpUrl ? "animate-pulse opacity-70" : ""}`}
          >
            {artistLine}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? `Pauzeer ${station.line1}` : `Speel ${station.line1}`}
        className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-black/10 transition hover:bg-white/95"
        style={{ color: playColor ?? "var(--glxy-station-play)" }}
      >
        {playing ? (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <rect x="5.5" y="4" width="5" height="16" rx="1.4" />
            <rect x="13.5" y="4" width="5" height="16" rx="1.4" />
          </svg>
        ) : (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M7 4.5v15L21 12 7 4.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function GlxyStationListenStrip({
  stations,
  colorOverrides,
}: {
  stations: GlxyStation[];
  colorOverrides?: Record<string, string> | null;
}) {
  const { playing, activeStationId, toggleStation } = useGlxyRadio();
  const [npById, setNpById] = useState<Record<string, { title: string; artist: string }>>({});
  const [npLoading, setNpLoading] = useState(true);

  const idKey = useMemo(() => stations.map((s) => s.id).sort().join(","), [stations]);
  const stationsRef = useRef(stations);
  stationsRef.current = stations;

  useEffect(() => {
    const list = stationsRef.current;
    if (!idKey) {
      setNpById({});
      setNpLoading(false);
      return;
    }
    const ids = list.map((s) => s.id);
    const anyNp = list.some((s) => s.nowPlayingUrl?.trim());
    if (!anyNp) {
      setNpById({});
      setNpLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const q = encodeURIComponent(ids.join(","));
        const r = await fetch(`/api/stations/now-playing-batch?ids=${q}`, { cache: "no-store" });
        const j = (await r.json()) as { byId?: Record<string, { title?: string; artist?: string }> };
        if (cancelled) return;
        const raw = j.byId ?? {};
        const next: Record<string, { title: string; artist: string }> = {};
        for (const id of ids) {
          const row = raw[id];
          next[id] = { title: (row?.title ?? "").trim(), artist: (row?.artist ?? "").trim() };
        }
        setNpById(next);
      } catch {
        if (!cancelled) setNpById({});
      } finally {
        if (!cancelled) setNpLoading(false);
      }
    };

    void load();
    const t = window.setInterval(load, 22_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [idKey]);

  const n = Math.max(stations.length, 1);

  return (
    <section className="w-full" aria-label="GLXY zenders">
      <ul
        className={`kiss-station-strip grid w-full gap-1.5 sm:gap-2 md:gap-2 lg:gap-3 ${n === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        style={{ ["--kiss-station-n" as string]: String(n) }}
      >
        {stations.map((s) => (
          <li key={s.id} className="min-w-0">
            <StationCardCompact
              station={s}
              playing={playing && activeStationId === s.id}
              onToggle={() => void toggleStation(s)}
              bgOverride={colorOverrides?.[s.id] ?? null}
              npTitle={npById[s.id]?.title ?? ""}
              npArtist={npById[s.id]?.artist ?? ""}
              npLoading={npLoading && !!(s.nowPlayingUrl?.trim())}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
