"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import AppImage from "@/components/AppImage";
import type { GlxyStation } from "@/lib/glxyStations";
import { GLXY_STATIONS } from "@/lib/glxyStations";

function StationLogo({ station }: { station: GlxyStation }) {
  const initial = station.line1.charAt(0).toUpperCase();
  if (station.logoUrl) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/20 shadow-inner ring-1 ring-black/10">
        <AppImage
          src={station.logoUrl}
          alt=""
          width={44}
          height={44}
          className="h-full w-full object-cover"
          aria-hidden
        />
      </div>
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black/15 text-sm font-black uppercase tracking-tighter ring-1 ring-black/10">
      {initial}
    </div>
  );
}

function StationCard({
  station,
  playing,
  onToggle,
}: {
  station: GlxyStation;
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-md px-3 py-2.5 shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] ${station.cardClass}`}
      style={
        station.zebraPattern
          ? {
              backgroundImage:
                "repeating-linear-gradient(-52deg, rgba(0,0,0,0.06) 0 10px, transparent 10px 20px), linear-gradient(#facc15, #facc15)",
            }
          : undefined
      }
    >
      <div className="flex items-center gap-3">
        <StationLogo station={station} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-black uppercase leading-tight tracking-wide md:text-xs">{station.line1}</p>
          <p className="truncate text-[10px] font-semibold uppercase leading-tight opacity-90 md:text-[11px]">{station.line2}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? `Pauzeer ${station.line1}` : `Speel ${station.line1}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white shadow-md ring-2 ring-black/10 transition hover:bg-white/95"
        >
          {playing ? (
            <span className="flex h-3.5 w-3.5 gap-0.5">
              <span className="h-full w-1 rounded-sm bg-[#e11d48]" />
              <span className="h-full w-1 rounded-sm bg-[#e11d48]" />
            </span>
          ) : (
            <span className="ml-0.5 border-y-[7px] border-l-[12px] border-y-transparent border-l-[#e11d48]" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

export function GlxyStationSidebar() {
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
    <aside className="w-full shrink-0 lg:w-[min(100%,268px)] xl:w-[280px]">
      <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#6d6d6d] md:text-[11px] lg:text-[#363636]">
        Of luister naar
      </p>
      <audio ref={audioRef} className="hidden" preload="none" playsInline />
      <ul className="flex flex-col gap-2 md:gap-2.5">
        {GLXY_STATIONS.map((s) => (
          <li key={s.id}>
            <StationCard station={s} playing={playingId === s.id} onToggle={() => toggle(s)} />
          </li>
        ))}
      </ul>
      <Link
        href="/frequenties"
        className="mt-4 flex w-full items-center justify-center rounded-md bg-[#363636] py-3 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-[#2a2a2a] md:text-xs"
      >
        Alle zenders
      </Link>
    </aside>
  );
}
