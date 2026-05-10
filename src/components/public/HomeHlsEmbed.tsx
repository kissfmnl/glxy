"use client";

import Hls from "hls.js";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

function volumeSliderStyle(volume: number): CSSProperties {
  return { ["--kiss-vol-pct" as string]: `${Math.round(volume * 100)}%` };
}

export function HomeHlsEmbed({
  src,
  title,
  compact,
  className,
  /** Vult een 16:9-frame (parent met aspect-video); video gebruikt object-cover; fullscreen op deze root. */
  hero,
}: {
  /** HLS playlist URL (.m3u8) */
  src: string;
  title?: string;
  /** Small fixed column / hero sidebar */
  compact?: boolean;
  className?: string;
  hero?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRootRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const volumeRef = useRef(0);
  /** Onthouden voor één-klik dempen / geluid terug. */
  const volumeBeforeMuteRef = useRef(0.65);
  const [status, setStatus] = useState<"idle" | "playing" | "error">("idle");
  const [isPaused, setIsPaused] = useState(true);
  const [volume, setVolume] = useState(0);
  /** Start muted + volume 0 so autoplay is allowed and playback is still until the user raises volume. */
  const [muted, setMuted] = useState(true);

  volumeRef.current = volume;

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const silent = muted || volume < 0.001;
    if (silent) {
      const next = volumeBeforeMuteRef.current > 0.001 ? volumeBeforeMuteRef.current : 0.65;
      setVolume(next);
      setMuted(false);
    } else {
      volumeBeforeMuteRef.current = volume > 0.001 ? volume : volumeBeforeMuteRef.current;
      setVolume(0);
      setMuted(true);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.volume = volumeRef.current;

    const tryPlay = () => video.play().catch(() => {});

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const onReady = () => {
        video.volume = volumeRef.current;
        setStatus("playing");
        tryPlay();
      };
      video.addEventListener("loadedmetadata", onReady, { once: true });
      video.addEventListener("canplay", onReady, { once: true });
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.volume = volumeRef.current;
        setStatus("playing");
        tryPlay();
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setStatus("error");
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    setStatus("error");
    return undefined;
  }, [src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setIsPaused(false);
    const onPause = () => setIsPaused(true);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  if (!src) return null;

  const shell = hero
    ? `relative h-full min-h-0 w-full overflow-hidden rounded-xl bg-black/95 ring-1 ring-white/10 ${className ?? ""}`
    : `relative overflow-hidden rounded-lg border bg-black/90 shadow-[0_14px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 border-[var(--brand-primary)]/35 ${compact ? "rounded-lg" : "rounded-xl"} ${className ?? ""}`;

  const videoClassName = hero
    ? "absolute inset-0 z-0 h-full w-full bg-black object-cover"
    : `aspect-video z-0 w-full bg-black object-contain ${
        compact ? "max-h-[min(42vh,380px)] md:max-h-[min(46vh,420px)]" : "max-h-[min(55vh,520px)]"
      }`;

  return (
    <div className={shell}>
      {status === "error" ? (
        <p className="px-6 py-10 text-center text-sm font-semibold text-white/65">
          De livestream kan in deze browser niet worden afgespeeld. Safari of een recente Chrome/Chromium-desktop helpt vaak het best voor HLS.
        </p>
      ) : (
        <div
          ref={playerRootRef}
          className={hero ? "group absolute inset-0 overflow-hidden" : "relative"}
        >
          <video
            ref={videoRef}
            className={videoClassName}
            muted={muted}
            autoPlay
            playsInline
            aria-label={title ?? "GLXY live video"}
          />

          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-black/55 via-black/20 to-transparent ${
              hero ? "opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100" : ""
            }`}
          />
          <div
            className={`absolute z-[2] flex w-full items-center md:inset-x-4 ${
              hero
                ? "pointer-events-none inset-x-2 bottom-2 gap-2 px-1 opacity-0 transition-opacity duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100"
                : "pointer-events-none inset-x-3 bottom-3 gap-3 [&>*]:pointer-events-auto"
            }`}
          >
            <button
              type="button"
              style={{
                backgroundColor: "var(--glxy-hero-control-surface)",
                color: "var(--glxy-hero-control-icon)",
              }}
              className={`inline-flex shrink-0 items-center justify-center self-center rounded-md ring-1 ring-white/12 backdrop-blur hover:brightness-110 ${
                hero ? "h-9 w-9" : "h-10 w-10"
              }`}
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                if (v.paused) {
                  if (volume > 0) setMuted(false);
                  v.play().catch(() => {});
                } else {
                  v.pause();
                }
              }}
              aria-label={isPaused ? "Afspelen" : "Pauze"}
            >
              {isPaused ? (
                <svg className={hero ? "h-5 w-5" : "h-6 w-6"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5.5v13L18.5 12 8 5.5z" />
                </svg>
              ) : (
                <svg className={hero ? "h-5 w-5" : "h-6 w-6"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="6" y="5" width="4" height="14" rx="1.2" />
                  <rect x="14" y="5" width="4" height="14" rx="1.2" />
                </svg>
              )}
            </button>

            <div
              style={{ backgroundColor: "var(--glxy-hero-control-surface)" }}
              className={
                hero
                  ? "flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 ring-1 ring-white/12 backdrop-blur-sm"
                  : "flex min-h-10 min-w-0 max-w-[min(60vw,240px)] flex-1 items-center gap-2 rounded-md px-2 ring-1 ring-white/12 backdrop-blur"
              }
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                style={{ color: "var(--glxy-hero-control-icon)" }}
                className={`inline-flex shrink-0 items-center justify-center rounded hover:opacity-90 ${hero ? "h-8 w-8" : "h-9 w-9"}`}
                aria-label={muted || volume < 0.001 ? "Geluid aan" : "Dempen"}
              >
                {muted || volume < 0.001 ? (
                  <svg className={hero ? "h-4 w-4" : "h-[18px] w-[18px]"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 4v-5.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className={hero ? "h-4 w-4" : "h-[18px] w-[18px]"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12zm0-9v2.06a9 9 0 0 1 0 13.88V21a11 11 0 0 0 0-18z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  setMuted(val === 0);
                  if (val > 0.001) volumeBeforeMuteRef.current = val;
                }}
                className={`kiss-hero-vol-slider kiss-hero-vol-slider--embed flex-1 ${hero ? "min-w-[72px]" : "min-w-[88px]"}`}
                style={volumeSliderStyle(volume)}
                aria-label="Volume"
              />
            </div>

            <button
              type="button"
              style={{
                backgroundColor: "var(--glxy-hero-control-surface)",
                color: "var(--glxy-hero-control-icon)",
              }}
              className={`inline-flex shrink-0 items-center justify-center self-center rounded-md ring-1 ring-white/12 backdrop-blur hover:brightness-110 ${
                hero ? "h-9 w-9" : "h-10 w-10"
              }`}
              onClick={async () => {
                const root = playerRootRef.current;
                if (!root) return;
                try {
                  const doc = document as Document & {
                    webkitFullscreenElement?: Element | null;
                    webkitExitFullscreen?: () => Promise<void>;
                  };
                  const fsEl =
                    document.fullscreenElement ??
                    doc.webkitFullscreenElement ??
                    (document as unknown as { mozFullScreenElement?: Element | null }).mozFullScreenElement;
                  if (fsEl) {
                    if (document.exitFullscreen) await document.exitFullscreen();
                    else await doc.webkitExitFullscreen?.();
                    return;
                  }
                  if (root.requestFullscreen) await root.requestFullscreen();
                  else {
                    const r = root as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
                    await r.webkitRequestFullscreen?.();
                  }
                } catch {
                  /* fullscreen niet beschikbaar */
                }
              }}
              aria-label="Fullscreen"
            >
              <svg
                viewBox="0 0 24 24"
                className={`shrink-0 ${hero ? "h-4 w-4" : "h-5 w-5"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
