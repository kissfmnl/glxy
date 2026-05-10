"use client";

import { getGlxySharedAudio, useGlxyRadio } from "@/components/public/GlxyRadioProvider";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK } from "@/lib/mock/site";

const PIN_KEY = "glxy_mini_player_pinned";

function kissVolumeSliderStyle(volume: number): CSSProperties {
  return { ["--kiss-vol-pct" as string]: `${Math.round(volume * 100)}%` } as CSSProperties;
}

function IconDockBottom({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11l4 4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V5" />
    </svg>
  );
}

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
  const { activeStation, playing, togglePlay, volume, setVolume } = useGlxyRadio();
  const [pinned, setPinned] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [dockProgress, setDockProgress] = useState(0);
  const [dockLockedByScroll, setDockLockedByScroll] = useState(false);
  const [np, setNp] = useState({ title: "", artist: "" });
  const [itunesCover, setItunesCover] = useState<string | null>(null);
  const [coverTier, setCoverTier] = useState(0);
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
    if (!activeStation?.id) return;
    const npUrl = activeStation.nowPlayingUrl?.trim();
    const poll = async () => {
      if (!npUrl) {
        setNp({ title: "", artist: "" });
        return;
      }
      try {
        const r = await fetch(`/api/stations/now-playing?id=${encodeURIComponent(activeStation.id)}`);
        const j = (await r.json()) as { title?: string; artist?: string };
        setNp({
          title: (j.title ?? "").trim(),
          artist: (j.artist ?? "").trim(),
        });
      } catch {
        setNp({ title: "", artist: "" });
      }
    };
    poll();
    const t = window.setInterval(poll, 12_000);
    return () => window.clearInterval(t);
  }, [activeStation?.id, activeStation?.nowPlayingUrl]);

  useEffect(() => {
    const hasNp = np.title || np.artist;
    if (!hasNp) {
      setItunesCover(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/cover-art?artist=${encodeURIComponent(np.artist)}&title=${encodeURIComponent(np.title)}`,
        );
        const j = (await r.json()) as { url?: string };
        if (cancelled) return;
        const u = j.url?.trim();
        setItunesCover(u || null);
      } catch {
        if (!cancelled) setItunesCover(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [np.title, np.artist]);

  useEffect(() => {
    setCoverTier(0);
  }, [activeStation?.id, itunesCover, np.title, np.artist]);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;

    const ARM_SCROLL_Y = 56;
    const MORPH_WINDOW_PX = 420;
    const SHORT_PAGE_MAX_SCROLL = 220;

    const computeScrollState = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (pinned) return { target: 1, lockedByScroll: false };
      if (maxScroll <= 0) return { target: 1, lockedByScroll: false };
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    const a = getGlxySharedAudio();
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

  if (!hydrated) return null;

  const npArtist = (np.artist ?? "").trim();
  const npTitle = (np.title ?? "").trim();
  const npCombined =
    npArtist && npTitle ? `${npArtist} — ${npTitle}` : npArtist || npTitle || "";
  const titleLine = npCombined || activeStation?.line1 || "GLXY Radio";
  const artistLine =
    npArtist && npTitle
      ? activeStation?.line2?.trim() || ""
      : npArtist || npTitle
        ? ""
        : activeStation?.line2 || "Live stream";

  const artworkSrc =
    coverTier === 0 && itunesCover
      ? itunesCover
      : coverTier <= 1 && activeStation?.logoUrl?.trim()
        ? activeStation.logoUrl.trim()
        : MOCK_COVER_FALLBACK;

  const visualProgress = dockProgress;
  const sideInsetPx = 12 * (1 - visualProgress);
  const bottomInset = `calc(${(1 - visualProgress) * 0.9}rem + env(safe-area-inset-bottom))`;
  const maxWidth = visualProgress >= 1 ? "100vw" : `calc(980px + ${visualProgress.toFixed(4)} * (100vw - 980px))`;
  const radiusPhase = Math.max(0, Math.min(1, (visualProgress - 0.58) / 0.42));
  const radius = `${Math.round((1 - radiusPhase) * 16)}px`;
  const mixedShadowY = 12 - visualProgress * 20;
  const mixedShadowBlur = 40 - visualProgress * 10;

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
        className="kiss-mini-player-shell relative mx-auto overflow-hidden border px-4 py-3 shadow-lg"
        style={{
          width: "100%",
          maxWidth,
          borderRadius: radius,
          boxShadow: `0 ${mixedShadowY.toFixed(2)}px ${mixedShadowBlur.toFixed(2)}px rgba(0,0,0,${(0.28 + visualProgress * 0.12).toFixed(3)})`,
          backgroundColor: "var(--glxy-mini-bg)",
          borderColor: "var(--glxy-mini-border)",
          color: "var(--glxy-mini-text)",
        }}
      >
        <div className="relative z-10 flex w-full flex-wrap items-center gap-3 sm:flex-nowrap">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-sm"
              style={{ backgroundColor: "var(--glxy-mini-muted)" }}
            >
              <AppImage
                src={artworkSrc}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setCoverTier((t) => Math.min(t + 1, 2))}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--glxy-mini-muted)" }}>
                Nu live
              </p>
              <p className="truncate text-sm font-black" style={{ color: "var(--glxy-mini-text)" }}>
                {titleLine}
              </p>
              {artistLine ? (
                <p className="truncate text-xs font-bold" style={{ color: "var(--glxy-mini-muted)" }}>
                  {artistLine}
                </p>
              ) : null}
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 py-0.5">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="kiss-volume-slider-mini hidden w-32 sm:block md:w-36"
              style={kissVolumeSliderStyle(volume)}
              aria-label="Volume"
            />
            <button
              type="button"
              onClick={() => void togglePlay()}
              className="kiss-mini-player-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black shadow-md"
              style={{
                backgroundColor: "var(--glxy-mini-accent)",
                color: "var(--glxy-mini-play-icon)",
              }}
              aria-label={playing ? "Pauzeer stream" : "Speel stream"}
            >
              {playing ? (
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5.5" y="4" width="5" height="16" rx="1.4" />
                  <rect x="13.5" y="4" width="5" height="16" rx="1.4" />
                </svg>
              ) : (
                <svg className="h-8 w-8" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M7 4.5v15L21 12 7 4.5z" />
                </svg>
              )}
            </button>
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
              className={`kiss-mini-player-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                dockLockedByScroll ? "pointer-events-none cursor-not-allowed border-white/10 bg-white/10 text-white/35" : ""
              }`}
              style={
                dockLockedByScroll
                  ? undefined
                  : pinned
                    ? {
                        borderColor: "var(--glxy-mini-accent)",
                        backgroundColor: "color-mix(in srgb, var(--glxy-mini-accent) 18%, transparent)",
                        color: "var(--glxy-mini-accent)",
                      }
                    : {
                        borderColor: "var(--glxy-mini-border)",
                        color: "var(--glxy-mini-text)",
                      }
              }
              aria-label={
                dockLockedByScroll
                  ? "Miniplayer al automatisch volledig breed onderaan de pagina"
                  : pinned
                    ? "Miniplayer losmaken"
                    : "Miniplayer vastzetten onderaan het scherm"
              }
              title={dockLockedByScroll ? "Automatisch volledig breed onderaan pagina" : pinned ? "Losmaken" : "Vastzetten onderaan"}
            >
              {pinned ? <IconUndock className="h-5 w-5" /> : <IconDockBottom className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
