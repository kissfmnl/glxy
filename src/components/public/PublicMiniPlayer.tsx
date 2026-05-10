"use client";

import { getGlxySharedAudio, useGlxyRadio } from "@/components/public/GlxyRadioProvider";
import { glxyChannelHeading } from "@/lib/glxyStations";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK } from "@/lib/mock/site";

function kissVolumeSliderStyle(volume: number): CSSProperties {
  return { ["--kiss-vol-pct" as string]: `${Math.round(volume * 100)}%` } as CSSProperties;
}

export function PublicMiniPlayer() {
  const { activeStation, activeStationId, stations, playing, togglePlay, volume, setVolume, selectStationAndPlay } =
    useGlxyRadio();
  const [hydrated, setHydrated] = useState(false);
  const [dockProgress, setDockProgress] = useState(0);
  const [np, setNp] = useState({ title: "", artist: "" });
  const [itunesCover, setItunesCover] = useState<string | null>(null);
  const [coverTier, setCoverTier] = useState(0);
  const [stationPickerOpen, setStationPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const dockTargetRef = useRef(0);
  const dockCurrentRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!stationPickerOpen) return;
    const onDocDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setStationPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [stationPickerOpen]);

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
      if (maxScroll <= 0) return 1;
      if (maxScroll <= SHORT_PAGE_MAX_SCROLL) {
        return Math.max(0, Math.min(1, window.scrollY / maxScroll));
      }
      if (window.scrollY <= ARM_SCROLL_Y) return 0;
      const startY = Math.max(ARM_SCROLL_Y, maxScroll - MORPH_WINDOW_PX);
      const endY = maxScroll;
      const raw = (window.scrollY - startY) / Math.max(1, endY - startY);
      return Math.max(0, Math.min(1, raw));
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
      dockTargetRef.current = computeScrollState();
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
  }, [hydrated]);

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
  /** Titel op de eerste regel; artiest op de tweede (zoals op de kaart). */
  const titleLine = npTitle || activeStation?.line1?.trim() || "GLXY Radio";
  const artistLine = npArtist || activeStation?.line2?.trim() || "";

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
          <div ref={pickerRef} className="relative min-w-0 flex-1">
            <button
              type="button"
              className="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-transparent text-left outline-none ring-[var(--glxy-mini-accent)]/35 hover:border-white/10 hover:bg-white/[0.04] focus-visible:ring-2"
              onClick={() => setStationPickerOpen((o) => !o)}
              aria-expanded={stationPickerOpen}
              aria-haspopup="listbox"
              aria-label="Zender kiezen"
            >
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
              <div className="min-w-0 flex-1 py-0.5">
                <p
                  className="truncate text-sm font-black uppercase leading-tight tracking-wide"
                  style={{ color: "var(--glxy-mini-text)" }}
                >
                  {titleLine}
                </p>
                {artistLine ? (
                  <p
                    className="truncate text-xs font-semibold uppercase leading-snug tracking-wide"
                    style={{ color: "var(--glxy-mini-muted)" }}
                  >
                    {artistLine}
                  </p>
                ) : null}
              </div>
            </button>

            {stationPickerOpen && stations.length > 0 ? (
              <div
                className="absolute bottom-full left-0 z-[60] mb-2 min-w-[min(100%,280px)] max-w-[min(100vw-2rem,320px)] rounded-xl border py-1 shadow-xl"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--glxy-mini-bg) 96%, black)",
                  borderColor: "var(--glxy-mini-border)",
                }}
                role="listbox"
              >
                {stations.map((s, i) => {
                  const active = s.id === activeStationId;
                  const disabled = !s.streamUrl?.trim();
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={disabled}
                      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-xs transition-colors ${
                        active ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"
                      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                      style={{ color: "var(--glxy-mini-text)" }}
                      onClick={() => {
                        if (disabled) return;
                        void selectStationAndPlay(s);
                        setStationPickerOpen(false);
                      }}
                    >
                      <span className="font-black uppercase tracking-wide opacity-70">
                        {glxyChannelHeading(s.id, i)}
                      </span>
                      <span className="font-semibold">{s.line1}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
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
          </div>
        </div>
      </div>
    </div>
  );
}
