"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const STREAM_URL = "https://stream.kissfm.nl/kissfm";
const PIN_KEY = "kiss_mini_player_pinned";

function kissVolumeSliderStyle(volume: number): CSSProperties {
  return { ["--kiss-vol-pct" as string]: `${Math.round(volume * 100)}%` } as CSSProperties;
}

function kissLipsSrc() {
  return "/api/fallback-album-logo";
}

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

/** Vastzetten: pijl naar beneden richting onderlijn */
function IconDockBottom({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11l4 4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V5" />
    </svg>
  );
}

/** Losmaken: pijl omhoog vanaf onderlijn */
function IconUndock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l4-4 4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v10" />
    </svg>
  );
}

export function PublicMiniPlayer() {
  const { data } = useSWR("/api/now-playing", fetcher, { refreshInterval: 15_000 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [dockProgress, setDockProgress] = useState(0);
  const [dockLockedByScroll, setDockLockedByScroll] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const dockTargetRef = useRef(0);
  const dockCurrentRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  useEffect(() => {
    try {
      setPinned(localStorage.getItem(PIN_KEY) === "1");
    } catch {
      setPinned(false);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const audio = getSharedAudio();
    if (!audio) return;
    setVolume(audio.volume);
    setIsPlaying(!audio.paused);

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolume = () => setVolume(audio.volume);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("volumechange", onVolume);
    return () => {
      audio.removeEventListener("playing", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("volumechange", onVolume);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;

    const ARM_SCROLL_Y = 56;
    const MORPH_WINDOW_PX = 420;
    /** Tot deze scrollhoogte: morph lineair mee (Join KISS, korte pagina’s). */
    const SHORT_PAGE_MAX_SCROLL = 220;

    const computeScrollState = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (pinned) return { target: 1, lockedByScroll: false };
      /* Geen scrollruimte: meteen volle breedte (o.a. korte playlist). */
      if (maxScroll <= 0) return { target: 1, lockedByScroll: false };
      /* Korte pagina’s: breedte volgt scroll over de hele documenthoogte */
      if (maxScroll <= SHORT_PAGE_MAX_SCROLL) {
        const target = Math.max(0, Math.min(1, window.scrollY / maxScroll));
        const lockedByScroll = window.scrollY >= maxScroll - 1;
        return { target, lockedByScroll };
      }
      if (window.scrollY <= ARM_SCROLL_Y) return { target: 0, lockedByScroll: false };
      const startY = Math.max(ARM_SCROLL_Y, maxScroll - MORPH_WINDOW_PX);
      const endY = maxScroll;
      const raw = (window.scrollY - startY) / Math.max(1, endY - startY);
      const target = Math.max(0, Math.min(1, raw));
      const lockedByScroll = window.scrollY >= maxScroll - 1;
      return { target, lockedByScroll };
    };

    const animateToTarget = (ts: number) => {
      const prevTs = lastTsRef.current || ts;
      const dt = ts - prevTs;
      lastTsRef.current = ts;

      const target = dockTargetRef.current;
      const current = dockCurrentRef.current;
      const diff = target - current;
      const alpha = 1 - Math.exp(-dt / 120);
      const next = current + diff * alpha;

      if (Math.abs(target - next) < 0.001) {
        dockCurrentRef.current = target;
        setDockProgress(target);
        animFrameRef.current = null;
        lastTsRef.current = 0;
        return;
      }

      dockCurrentRef.current = next;
      setDockProgress(next);
      animFrameRef.current = window.requestAnimationFrame(animateToTarget);
    };

    const evaluateDockState = () => {
      const state = computeScrollState();
      dockTargetRef.current = state.target;
      setDockLockedByScroll(state.lockedByScroll);
      if (animFrameRef.current === null) {
        animFrameRef.current = window.requestAnimationFrame(animateToTarget);
      }
    };

    evaluateDockState();
    window.addEventListener("scroll", evaluateDockState, { passive: true });
    window.addEventListener("resize", evaluateDockState);
    const footer = document.getElementById("kiss-public-footer");
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => evaluateDockState()) : null;
    if (ro && footer) ro.observe(footer);
    if (ro) ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("scroll", evaluateDockState);
      window.removeEventListener("resize", evaluateDockState);
      if (ro) ro.disconnect();
      if (animFrameRef.current !== null) {
        window.cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [pinned, hydrated]);

  /**
   * Browsers pauzeren streams soms op achtergrond-tab. Als `pause` optreedt terwijl het tabblad verborgen is,
   * markeren we dat en proberen bij terugkomst `play()` (niet bij een expliciete pauze op een zichtbaar tabblad).
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const a = getSharedAudio();
    if (!a) return;
    let pausedWhileTabHidden = false;
    const onPause = () => {
      if (document.visibilityState === "hidden") pausedWhileTabHidden = true;
    };
    const onPlaying = () => {
      pausedWhileTabHidden = false;
    };
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (!pausedWhileTabHidden) return;
      pausedWhileTabHidden = false;
      if (a.paused) void a.play().catch(() => {});
    };
    a.addEventListener("pause", onPause);
    a.addEventListener("playing", onPlaying);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      a.removeEventListener("pause", onPause);
      a.removeEventListener("playing", onPlaying);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const cover = data?.cover as string | undefined;
  useEffect(() => {
    setCoverFailed(false);
  }, [cover]);
  const audio = getSharedAudio();
  if (!audio || !hydrated) return null;
  const visualProgress = dockProgress;

  const sideInsetPx = 12 * (1 - visualProgress);
  const bottomInset = `calc(${(1 - visualProgress) * 0.9}rem + env(safe-area-inset-bottom))`;
  const maxWidth = visualProgress >= 1 ? "100vw" : `calc(980px + ${visualProgress.toFixed(4)} * (100vw - 980px))`;
  const radiusPhase = Math.max(0, Math.min(1, (visualProgress - 0.58) / 0.42));
  const radius = `${Math.round((1 - radiusPhase) * 16)}px`;
  const mixedShadowY = 12 - visualProgress * 20;
  const mixedShadowBlur = 40 - visualProgress * 10;
  const mixedShadowAlpha = 0.45 - visualProgress * 0.09;

  return (
    <div
      className="fixed left-0 right-0 kiss-mini-player-in z-[56]"
      style={{
        paddingLeft: `${sideInsetPx.toFixed(2)}px`,
        paddingRight: `${sideInsetPx.toFixed(2)}px`,
        bottom: bottomInset,
      }}
    >
      <div
        className="relative mx-auto overflow-hidden border border-white/15 bg-[#1e375a] px-4 py-3 text-white"
        style={{
          width: "100%",
          maxWidth,
          borderRadius: radius,
          boxShadow: `0 ${mixedShadowY.toFixed(2)}px ${mixedShadowBlur.toFixed(2)}px rgba(16,37,63,${mixedShadowAlpha.toFixed(4)})`,
        }}
      >
        <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#28456e] shrink-0 shadow-sm">
              {cover && !coverFailed ? (
                <img src={cover} alt="" className="w-full h-full object-cover" onError={() => setCoverFailed(true)} />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-[18%]" style={{ backgroundColor: "var(--fallback-album-bg, #1e375a)" }}>
                  <img src={kissLipsSrc()} alt="" className="h-full w-full max-h-[72%] object-contain opacity-95" loading="lazy" draggable={false} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/70">Nu live</p>
              <p className="text-sm font-black truncate">{data?.current?.title || "KISS FM Live"}</p>
              <p className="text-xs font-bold text-white/75 truncate">{data?.current?.artist || "KISS FM"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (audio.paused) void audio.play().catch(() => {});
              else audio.pause();
            }}
            className="kiss-mini-player-btn w-11 h-11 rounded-full bg-[#37bfbf] text-[#10253f] font-black shrink-0 flex items-center justify-center"
            aria-label={isPlaying ? "Pauzeer stream" : "Speel stream"}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1.2" />
                <rect x="14" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M9 6v12l10-6-10-6z" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2 justify-self-end py-1.5">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                audio.volume = v;
              }}
              className="w-36 hidden sm:block kiss-volume-slider-mini"
              style={kissVolumeSliderStyle(volume)}
              aria-label="Volume"
            />
            <button
              type="button"
              disabled={dockLockedByScroll}
              onClick={() => {
                const next = !pinned;
                setPinned(next);
                try {
                  if (next) localStorage.setItem(PIN_KEY, "1");
                  else localStorage.removeItem(PIN_KEY);
                } catch {
                  /* ignore */
                }
              }}
              className={`kiss-mini-player-btn w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 ${
                dockLockedByScroll
                  ? "border-white/10 bg-white/10 text-white/35 cursor-not-allowed pointer-events-none"
                  : pinned
                    ? "border-[#37bfbf] bg-[#37bfbf]/20 text-[#37bfbf]"
                    : "border-white/20 text-white/80 hover:text-white"
              }`}
              aria-label={
                dockLockedByScroll
                  ? "Miniplayer al automatisch volledig breed onderaan de pagina"
                  : pinned
                    ? "Miniplayer losmaken (weer meeschuiven)"
                    : "Miniplayer vastzetten onderaan het scherm"
              }
              title={dockLockedByScroll ? "Automatisch volledig breed onderaan pagina" : pinned ? "Losmaken" : "Vastzetten onderaan"}
            >
              {pinned ? <IconUndock className="w-5 h-5" /> : <IconDockBottom className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
