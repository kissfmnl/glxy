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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    video.muted = true;
    video.defaultMuted = true;
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
  }, [src]);

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
      )}
    </div>
  );
}
