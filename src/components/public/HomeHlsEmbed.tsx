"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

export function HomeHlsEmbed({
  src,
  title,
  compact,
  className,
}: {
  /** HLS playlist URL (.m3u8) */
  src: string;
  title?: string;
  /** Small fixed column / hero sidebar */
  compact?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<"idle" | "playing" | "error">("idle");
  const [isPaused, setIsPaused] = useState(true);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    video.muted = true;
    video.defaultMuted = true;
    video.volume = volume;
    video.playsInline = true;
    video.setAttribute("playsinline", "");

    const tryPlay = () => video.play().catch(() => {});

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const onReady = () => {
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
  }, [src, volume]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
  }, [volume]);

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

  const shell =
    "relative overflow-hidden rounded-lg border bg-black/90 shadow-[0_14px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10";
  const borderAccent = "border-[var(--brand-primary)]/35";

  return (
    <div className={`${shell} ${borderAccent} ${compact ? "rounded-lg" : "rounded-xl"} ${className ?? ""}`}>
      {status === "error" ? (
        <p className="px-6 py-10 text-center text-sm font-semibold text-white/65">
          De livestream kan in deze browser niet worden afgespeeld. Safari of een recente Chrome/Chromium-desktop helpt vaak het best voor HLS.
        </p>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            className={`aspect-video w-full bg-black object-contain ${
              compact ? "max-h-[min(42vh,380px)] md:max-h-[min(46vh,420px)]" : "max-h-[min(55vh,520px)]"
            }`}
            muted
            autoPlay
            playsInline
            aria-label={title ?? "GLXY live video"}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 md:inset-x-4">
            <button
              type="button"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/15 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20"
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                if (v.paused) v.play().catch(() => {});
                else v.pause();
              }}
              aria-label={isPaused ? "Afspelen" : "Pauze"}
            >
              {isPaused ? (
                <span className="ml-0.5 border-y-[7px] border-l-[12px] border-y-transparent border-l-white" aria-hidden />
              ) : (
                <span className="flex h-4 w-4 gap-1" aria-hidden>
                  <span className="h-full w-1.5 bg-white" />
                  <span className="h-full w-1.5 bg-white" />
                </span>
              )}
            </button>

            <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 rounded-md bg-white/10 px-3 py-2 ring-1 ring-white/15 backdrop-blur">
              <svg className="h-4 w-4 text-white/85" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12zm0-9v2.06a9 9 0 0 1 0 13.88V21a11 11 0 0 0 0-18z" />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
                aria-label="Volume"
              />
            </div>

            <button
              type="button"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/15 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20"
              onClick={async () => {
                const wrap = videoRef.current?.parentElement;
                if (!wrap) return;
                const doc: any = document;
                if (doc.fullscreenElement) {
                  await doc.exitFullscreen?.().catch(() => {});
                  return;
                }
                await (wrap as any).requestFullscreen?.().catch(() => {});
              }}
              aria-label="Fullscreen"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3H5a2 2 0 0 0-2 2v3m18-3v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3m11-5h3a2 2 0 0 0 2-2v-3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
