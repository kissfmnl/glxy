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
  const [status, setStatus] = useState<"idle" | "playing" | "error">("idle");
  const [isPaused, setIsPaused] = useState(true);
  const [volume, setVolume] = useState(0);
  /** Start muted + volume 0 so autoplay is allowed and playback is still until the user raises volume. */
  const [muted, setMuted] = useState(true);

  volumeRef.current = volume;

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
              className={`inline-flex shrink-0 items-center justify-center rounded-md ring-1 ring-white/12 backdrop-blur hover:brightness-110 ${
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
                  ? "flex min-h-9 min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1 ring-1 ring-white/12 backdrop-blur-sm"
                  : "flex min-h-10 min-w-0 max-w-[min(60vw,240px)] flex-1 items-center gap-1.5 rounded-md px-2 py-1 ring-1 ring-white/12 backdrop-blur"
              }
            >
              <svg
                style={{ color: "var(--glxy-hero-control-icon)" }}
                className={`shrink-0 opacity-90 ${hero ? "h-3.5 w-3.5" : "h-4 w-4"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12zm0-9v2.06a9 9 0 0 1 0 13.88V21a11 11 0 0 0 0-18z" />
              </svg>
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
                }}
                className={`kiss-hero-vol-slider ${hero ? "h-3 min-w-[64px] flex-1" : "h-4 min-w-[80px] flex-1"}`}
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
              className={`inline-flex shrink-0 items-center justify-center rounded-md ring-1 ring-white/12 backdrop-blur hover:brightness-110 ${
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
