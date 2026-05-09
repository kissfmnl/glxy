"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppImage from "@/components/AppImage";
import type { GlxyStation } from "@/lib/glxyStations";
import { GLXY_STATIONS } from "@/lib/glxyStations";

function StationLogoCompact({ station }: { station: GlxyStation }) {
  const initial = station.line1.charAt(0).toUpperCase();
  if (station.logoUrl) {
    return (
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-white/20 shadow-inner ring-1 ring-black/10">
        <AppImage src={station.logoUrl} alt="" width={32} height={32} className="h-full w-full object-cover" aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-black/15 text-[10px] font-black uppercase tracking-tighter ring-1 ring-black/10">
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
  return (
    <div
      className={`group relative flex items-center gap-1.5 overflow-hidden rounded-md px-2 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:-translate-y-1 hover:brightness-[1.07] hover:shadow-[0_12px_32px_rgba(11,117,87,0.42)] active:scale-[0.99] sm:gap-2 sm:px-2.5 sm:py-2 ${station.cardClass}`}
      style={
        station.zebraPattern
          ? {
              backgroundImage:
                "repeating-linear-gradient(-52deg, rgba(0,0,0,0.06) 0 8px, transparent 8px 16px), linear-gradient(#facc15, #facc15)",
              ...(bgOverride ? { backgroundColor: bgOverride } : {}),
            }
          : bgOverride
            ? { backgroundColor: bgOverride }
            : undefined
      }
    >
      <StationLogoCompact station={station} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] font-black uppercase leading-tight tracking-wide sm:text-[10px]">{station.line1}</p>
        <p className="truncate text-[8px] font-semibold uppercase leading-tight opacity-90 sm:text-[9px]">{station.line2}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? `Pauzeer ${station.line1}` : `Speel ${station.line1}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-md ring-2 ring-black/10 transition hover:bg-white/95"
      >
        {playing ? (
          <span className="flex h-3 w-3 gap-0.5">
            <span className="h-full w-0.5 rounded-sm bg-[#e11d48]" />
            <span className="h-full w-0.5 rounded-sm bg-[#e11d48]" />
          </span>
        ) : (
          <span className="ml-0.5 border-y-[6px] border-l-[10px] border-y-transparent border-l-[#e11d48]" aria-hidden />
        )}
      </button>
    </div>
  );
}

export function GlxyStationListenStrip({ colorOverrides }: { colorOverrides?: Record<string, string> | null } = {}) {
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
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/55 md:text-[11px]">Luister naar</p>
      <audio ref={audioRef} className="hidden" preload="none" playsInline />
      <ul className="grid grid-cols-2 gap-1.5 sm:gap-2 md:grid-cols-4 md:gap-2 lg:gap-3">
        {GLXY_STATIONS.map((s) => (
          <li key={s.id} className="min-w-0">
            <StationCardCompact station={s} playing={playingId === s.id} onToggle={() => toggle(s)} bgOverride={colorOverrides?.[s.id] ?? null} />
          </li>
        ))}
      </ul>
    </section>
  );
}
