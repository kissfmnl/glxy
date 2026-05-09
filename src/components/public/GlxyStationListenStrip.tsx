"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppImage from "@/components/AppImage";
import type { GlxyStation } from "@/lib/glxyStations";

function StationLogoCompact({ station }: { station: GlxyStation }) {
  const initial = station.line1.charAt(0).toUpperCase();
  if (station.logoUrl) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/20 shadow-inner ring-1 ring-black/10 sm:h-12 sm:w-12">
        <AppImage
          src={station.logoUrl}
          alt=""
          width={1080}
          height={1080}
          className="h-full w-full object-cover object-center"
          aria-hidden
        />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/15 text-[11px] font-black uppercase tracking-tighter ring-1 ring-black/10 sm:h-12 sm:w-12">
      {initial}
    </div>
  );
}

function StationCardCompact({
  station,
  playing,
  onToggle,
  bgOverride,
}: {
  station: GlxyStation;
  playing: boolean;
  onToggle: () => void;
  bgOverride?: string | null;
}) {
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
      className={`group relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 overflow-hidden rounded-md px-2 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:-translate-y-1 hover:brightness-[1.07] hover:shadow-[0_12px_32px_rgba(11,117,87,0.42)] active:scale-[0.99] sm:gap-x-2.5 sm:px-2.5 sm:py-2.5 ${station.cardClass}`}
      style={bgStyle}
    >
      <div className="flex min-w-0 items-center gap-2">
        <StationLogoCompact station={station} />
        <div className="min-w-0">
          <p
            style={{ color: "var(--glxy-station-text)" }}
            className="truncate text-[9px] font-black uppercase leading-tight tracking-wide sm:text-[10px]"
          >
            {station.line1}
          </p>
          <p
            style={{ color: "var(--glxy-station-subtext)" }}
            className="truncate text-[8px] font-semibold uppercase leading-tight sm:text-[9px]"
          >
            {station.line2}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? `Pauzeer ${station.line1}` : `Speel ${station.line1}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-black/10 transition hover:bg-white/95"
        style={{ color: "var(--glxy-station-play)" }}
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
      <div className="min-w-0" aria-hidden />
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const clear = () => setPlayingId(null);
    el.addEventListener("ended", clear);
    el.addEventListener("error", clear);
    return () => {
      el.removeEventListener("ended", clear);
      el.removeEventListener("error", clear);
    };
  }, []);

  const toggle = useCallback(
    async (station: GlxyStation) => {
      const el = audioRef.current;
      if (!el) return;
      if (playingId === station.id) {
        el.pause();
        setPlayingId(null);
        return;
      }
      el.src = station.streamUrl;
      try {
        await el.play();
        setPlayingId(station.id);
      } catch {
        setPlayingId(null);
      }
    },
    [playingId],
  );

  return (
    <section className="w-full" aria-label="GLXY zenders">
      <audio ref={audioRef} className="hidden" preload="none" playsInline />
      <ul className="grid grid-cols-2 gap-1.5 sm:gap-2 md:grid-cols-4 md:gap-2 lg:gap-3">
        {stations.map((s) => (
          <li key={s.id} className="min-w-0">
            <StationCardCompact station={s} playing={playingId === s.id} onToggle={() => toggle(s)} bgOverride={colorOverrides?.[s.id] ?? null} />
          </li>
        ))}
      </ul>
    </section>
  );
}
