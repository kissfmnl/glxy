"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

export function HomeHlsEmbed({
  src,
  title,
}: {
  /** HLS playlist URL (.m3u8) */
  src: string;
  title?: string;
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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#1e375a]/20 bg-black/85 shadow-[0_14px_50px_rgba(12,31,51,0.35)]">
      <div className="absolute left-4 top-3 z-[1] flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">Live</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/90 backdrop-blur">
          Geluid standaard uit
        </span>
      </div>
      {status === "error" ? (
        <p className="px-6 py-10 text-center text-sm font-semibold text-white/65">
          De livestream kan in deze browser niet worden afgespeeld. Safari of een recente Chrome/Chromium-desktop helpt vaak het best voor HLS.
        </p>
      ) : (
        <video
          ref={videoRef}
          className="aspect-video max-h-[min(55vh,520px)] w-full bg-black object-contain"
          controls
          muted
          autoPlay
          playsInline
          aria-label={title ?? "GLXY live video"}
        />
      )}
    </div>
  );
}
