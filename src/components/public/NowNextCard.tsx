"use client";

import useSWR from "swr";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const STREAM_URL = "https://stream.kissfm.nl/kissfm";

function kissVolumeSliderStyle(volume: number): CSSProperties {
  return { ["--kiss-vol-pct" as string]: `${Math.round(volume * 100)}%` } as CSSProperties;
}

function kissLipsSrc() {
  return "/api/fallback-album-logo";
}

function HeroCoverThumb({ src }: { src: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (src && !failed) {
    return <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} onError={() => setFailed(true)} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center p-[18%]" style={{ backgroundColor: "var(--fallback-album-bg, #f2f8fb)" }}>
      <img src={kissLipsSrc()} alt="" className="h-full w-full max-h-[72%] object-contain opacity-90" loading="lazy" draggable={false} />
    </div>
  );
}

/** Zelfde basis als playlist-pagina “Nu te horen”-paneel. */
const HERO_NOW_FILL_DEFAULT =
  "linear-gradient(165deg, rgba(255,255,255,0.82) 0%, rgba(228,241,248,0.9) 42%, rgba(210,230,242,0.96) 100%)";

/** Straks: duidelijk andere zone onder het nu-blok. */
const HERO_NEXT_FILL =
  "linear-gradient(180deg, rgba(218,232,244,0.82) 0%, rgba(200,220,236,0.94) 45%, rgba(188,210,228,0.98) 100%)";

// Keep one shared audio element alive across route/component remounts.
function getSharedAudio() {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & { __kissAudio?: HTMLAudioElement };
  if (!w.__kissAudio) {
    const a = new Audio(STREAM_URL);
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    a.volume = 0.8;
    w.__kissAudio = a;
  }
  return w.__kissAudio;
}

export function NowNextCard({
  withPlayer,
  disableCardHover = false,
  variant = "default",
  labels,
}: {
  withPlayer?: boolean;
  disableCardHover?: boolean;
  variant?: "default" | "hero";
  labels?: { nowPlaying?: string; nextPlaying?: string; live?: string };
}) {
  const { data } = useSWR("/api/now-playing", fetcher, { refreshInterval: 15_000 });

  const current = data?.current;
  const next = data?.next;
  const cover = data?.cover as string | null | undefined;

  // Optional player controls (merged "play" with now/next card)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accent, setAccent] = useState("55,191,191");
  const [heroTint, setHeroTint] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);

  const audio = useMemo(() => {
    if (!withPlayer) return null;
    const shared = getSharedAudio();
    if (!shared) return null;
    return shared;
  }, [withPlayer]);

  useEffect(() => {
    if (!audio) return;
    audioRef.current = audio;
    setVolume(audio.volume);
    setIsPlaying(!audio.paused);
    setError(null);

    // Keep current buffer/stream state; avoid reload on route return.
    audio.preload = "auto";

    const onPlaying = () => {
      setIsPlaying(true);
      setError(null);
    };
    const onPause = () => setIsPlaying(false);
    const onVolume = () => setVolume(audio.volume);
    const onError = () => {
      setIsPlaying(false);
      setError("Stream niet beschikbaar");
    };
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("volumechange", onVolume);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("volumechange", onVolume);
      audio.removeEventListener("error", onError);
    };
  }, [audio]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (variant !== "hero" || !cover || typeof window === "undefined") {
      setHeroTint(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = cover;
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const sz = 32;
        canvas.width = sz;
        canvas.height = sz;
        ctx.drawImage(img, 0, 0, sz, sz);
        const { data } = ctx.getImageData(0, 0, sz, sz);
        let r = 0;
        let g = 0;
        let b = 0;
        let c = 0;
        for (let i = 0; i < data.length; i += 4) {
          const rr = data[i];
          const gg = data[i + 1];
          const bb = data[i + 2];
          const a = data[i + 3];
          if (a < 120) continue;
          if ((rr < 20 && gg < 20 && bb < 20) || (rr > 245 && gg > 245 && bb > 245)) continue;
          r += rr;
          g += gg;
          b += bb;
          c += 1;
        }
        if (!c) return;
        r = Math.round(r / c);
        g = Math.round(g / c);
        b = Math.round(b / c);
        const lr = Math.min(248, Math.round(232 + (r - 128) * 0.07));
        const lg = Math.min(248, Math.round(238 + (g - 128) * 0.07));
        const lb = Math.min(250, Math.round(244 + (b - 128) * 0.07));
        setHeroTint(`${lr},${lg},${lb}`);
      } catch {
        setHeroTint(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setHeroTint(null);
    };
    return () => {
      cancelled = true;
    };
  }, [cover, variant]);

  useEffect(() => {
    if (variant === "hero" || !cover || typeof window === "undefined") return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = cover;
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const sz = 24;
        canvas.width = sz;
        canvas.height = sz;
        ctx.drawImage(img, 0, 0, sz, sz);
        const { data } = ctx.getImageData(0, 0, sz, sz);
        let r = 0;
        let g = 0;
        let b = 0;
        let c = 0;
        for (let i = 0; i < data.length; i += 4) {
          const rr = data[i];
          const gg = data[i + 1];
          const bb = data[i + 2];
          const a = data[i + 3];
          if (a < 120) continue;
          if ((rr < 20 && gg < 20 && bb < 20) || (rr > 240 && gg > 240 && bb > 240)) continue;
          r += rr;
          g += gg;
          b += bb;
          c += 1;
        }
        if (!c) return;
        setAccent(`${Math.round(r / c)},${Math.round(g / c)},${Math.round(b / c)}`);
      } catch {
        // Keep previous accent.
      }
    };
    return () => {
      cancelled = true;
    };
  }, [cover, variant]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    setError(null);
    if (!a.paused) {
      a.pause();
      return;
    }
    // Geen async/await hier: anders loopt de “user gesture” van de klik soms af voordat play() draait,
    // en dan weigert de browser ten onrechte met NotAllowedError (zelfde symptoom als autoplay-blokkade).
    const p = a.play();
    if (p === undefined) return;
    p
      .then(() => setError(null))
      .catch((e: unknown) => {
        const dom = e instanceof DOMException ? e : null;
        const notAllowed = dom?.name === "NotAllowedError" || dom?.code === 20;
        if (notAllowed) {
          setError("Geen geluid? Tik nog één keer op play — je browser vraagt soms een tweede bevestiging.");
        } else {
          setError("Stream niet beschikbaar");
        }
      });
  }

  const nowLabel = labels?.nowPlaying ?? "Dit hoor je nu";
  const nextLabel = labels?.nextPlaying ?? "Dit hoor je straks";
  const liveLabel = labels?.live ?? "Live";

  const cardFillBg = `radial-gradient(720px 340px at 90% -12%, rgba(${accent},0.2), transparent 52%), linear-gradient(158deg, #e8f3f7 0%, #e2edf4 38%, #dbe8f1 100%)`;

  const nowHeroBlockBg = heroTint
    ? `radial-gradient(ellipse 105% 90% at 78% 26%, rgba(${heroTint},0.3) 0%, rgba(${heroTint},0.12) 42%, rgba(228,241,248,0.55) 68%, rgba(210,230,242,0.92) 100%), ${HERO_NOW_FILL_DEFAULT}`
    : HERO_NOW_FILL_DEFAULT;

  if (variant === "hero") {
    return (
      <div
        id={withPlayer ? "kiss-live-player" : undefined}
        className={`${disableCardHover ? "" : "kiss-public-panel"} relative w-full min-w-0 overflow-hidden rounded-2xl border border-solid border-[#1e375a]/14 scroll-mt-24 md:rounded-3xl`}
        style={{
          backgroundColor: "rgba(252, 253, 254, 0.48)",
          WebkitBackdropFilter: "blur(10px)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 20px rgba(30,55,90,0.06)",
        }}
      >
        {withPlayer ? (
          <div className="absolute right-4 top-3 z-20 md:right-5 md:top-4">
            <span
              className="inline-flex items-center gap-2 rounded-full border bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
              style={{
                color: "var(--brand-navy)",
                borderColor: "rgba(30,55,90,0.12)",
              }}
            >
              <span className="kiss-live-dot inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />
              {liveLabel}
            </span>
          </div>
        ) : null}

        <div
          className="relative z-10 px-5 py-5 md:px-6 md:py-6"
          style={{ background: nowHeroBlockBg, backgroundClip: "border-box" }}
        >
          {withPlayer ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
                <div className="flex min-w-0 max-w-full flex-1 items-start gap-3 sm:gap-4 pr-[3.5rem] sm:pr-14 md:max-w-none md:pr-0">
                  <div className="aspect-square h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-black/5 bg-black/5 sm:h-[5.25rem] sm:w-[5.25rem] md:h-[5.5rem] md:w-[5.5rem]">
                    <HeroCoverThumb src={cover} />
                  </div>
                  <div className="flex min-h-[4.5rem] min-w-0 flex-1 flex-col sm:min-h-[5.25rem] md:min-h-[5.5rem]">
                    <p className={`${KISS_PANEL_TITLE} leading-none`}>{nowLabel}</p>
                    <h3 className="mt-2 text-lg font-black leading-snug text-gray-900 line-clamp-2 sm:text-xl md:text-[1.65rem] md:leading-tight">
                      {current?.title ?? "Laden..."}
                    </h3>
                    <p className="mt-auto pt-1 text-sm font-bold leading-snug text-gray-600 line-clamp-2 md:text-base">
                      {current?.artist ?? "KISS FM"}
                    </p>
                  </div>
                </div>

                <div className="mt-1.5 flex shrink-0 flex-col items-stretch justify-end md:mt-2 md:w-[min(100%,17.5rem)] md:items-end">
                  <div className="flex items-center justify-end gap-3 md:gap-3.5">
                    <span className="text-gray-500 shrink-0" aria-hidden="true">
                      <svg className="h-4 w-4 md:h-[1.125rem] md:w-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="kiss-volume-slider-hero-on-light min-h-10 min-w-0 flex-1 md:max-w-[11rem]"
                      style={kissVolumeSliderStyle(volume)}
                      aria-label={`Volume ${Math.round(volume * 100)} procent`}
                    />
                    <button
                      onClick={toggle}
                      className="kiss-public-play-btn flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full shadow-lg outline-none transition-transform duration-200 hover:scale-105 md:h-[3.5rem] md:w-[3.5rem]"
                      style={{
                        backgroundColor: "var(--brand-primary)",
                        boxShadow: "0 6px 16px rgba(30, 55, 90, 0.18)",
                      }}
                      aria-label={isPlaying ? "Pauzeer" : "Speel live radio af"}
                    >
                      {isPlaying ? (
                        <svg className="h-6 w-6 text-white md:h-7 md:w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="6" y="5" width="4" height="14" rx="1.2" />
                          <rect x="14" y="5" width="4" height="14" rx="1.2" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-white md:h-7 md:w-7" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                          <path d="M9 6v12l10-6-10-6z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {error ? <p className="text-[11px] font-medium text-gray-600">{error}</p> : null}
            </div>
          ) : (
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="aspect-square h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-black/5 bg-black/5 sm:h-[5.25rem] sm:w-[5.25rem]">
                <HeroCoverThumb src={cover} />
              </div>
              <div className="flex min-h-[4.5rem] min-w-0 flex-1 flex-col sm:min-h-[5.25rem]">
                <p className={`${KISS_PANEL_TITLE} leading-none`}>{nowLabel}</p>
                <h3 className="mt-2 text-lg font-black leading-snug text-gray-900 line-clamp-2 sm:text-xl">
                  {current?.title ?? "Laden..."}
                </h3>
                <p className="mt-auto pt-1 text-sm font-bold text-gray-600 line-clamp-2">{current?.artist ?? "KISS FM"}</p>
              </div>
            </div>
          )}
        </div>

        <div
          className="relative z-10 border-t border-[#1e375a]/14 px-5 pt-4 pb-3.5 md:px-6"
          style={{ background: HERO_NEXT_FILL, backgroundClip: "border-box" }}
        >
          <p className={KISS_PANEL_TITLE}>{nextLabel}</p>
          <p className="mt-1 text-sm font-bold text-gray-800 line-clamp-2 leading-snug">
            {next ? `${next.artist} — ${next.title}` : "Laden..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={withPlayer ? "kiss-live-player" : undefined}
      className={`${disableCardHover ? "" : "kiss-public-panel"} relative w-full min-w-0 rounded-3xl border border-solid border-[#1e375a]/12 overflow-hidden scroll-mt-24 shadow-[0_2px_20px_rgba(30,55,90,0.06)]`}
      style={{
        background: cardFillBg,
        backgroundClip: "border-box",
      }}
    >
      {withPlayer && (
        <div className="absolute right-4 top-4 z-10">
          <span
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-white/95"
            style={{
              color: "var(--brand-navy)",
              borderColor: `rgba(${accent},0.35)`,
            }}
          >
            <span
              className="inline-flex w-1.5 h-1.5 rounded-full kiss-live-dot"
              style={{ backgroundColor: "#ef4444" }}
            />
            {liveLabel}
          </span>
        </div>
      )}

      <div className="relative z-10 p-5 flex items-start gap-5">
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-black/5 border border-black/5 shrink-0">
          <HeroCoverThumb src={cover} />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{nowLabel}</p>
          <h3 className="mt-1 text-xl font-black text-gray-900 truncate">
            {current?.title ?? "Laden..."}
          </h3>
          <p className="text-sm font-bold text-gray-600 truncate">
            {current?.artist ?? "KISS FM"}
          </p>
          {withPlayer && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={toggle}
                className="kiss-public-play-btn w-12 h-12 rounded-full flex items-center justify-center shadow-lg touch-manipulation outline-none shrink-0 transition-transform duration-200 hover:scale-105"
                style={{
                  backgroundColor: "var(--brand-primary)",
                  boxShadow: `0 12px 26px rgba(${accent},0.35)`,
                }}
                aria-label={isPlaying ? "Pauzeer" : "Speel live radio af"}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1.2" />
                    <rect x="14" y="5" width="4" height="14" rx="1.2" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-white"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="currentColor"
                  >
                    <path d="M9 6v12l10-6-10-6z" />
                  </svg>
                )}
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-[160px] py-1.5">
                <span className="text-gray-500 shrink-0" aria-hidden="true">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="min-w-0 flex-1 kiss-volume-slider h-10"
                  style={kissVolumeSliderStyle(volume)}
                  aria-label={`Volume ${Math.round(volume * 100)} procent`}
                />
              </div>
              {error ? <span className="text-[11px] font-medium text-gray-600 w-full">{error}</span> : null}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 px-5 py-3 border-t border-[#1e375a]/10 bg-[#d3e4ed]/75 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{nextLabel}</p>
          <p className="mt-1 text-sm font-bold text-gray-800 truncate">
            {next ? `${next.artist} — ${next.title}` : "Laden..."}
          </p>
        </div>
      </div>
    </div>
  );
}
