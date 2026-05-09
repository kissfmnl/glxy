"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppImage from "@/components/AppImage";
import { HomeHlsEmbed } from "@/components/public/HomeHlsEmbed";

function GlxyHeroLogo({ src }: { src: string }) {
  const [resolved, setResolved] = useState(src);

  useEffect(() => {
    setResolved(src);
  }, [src]);

  return (
    <div
      className="select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <AppImage
        src={resolved}
        alt="GLXY"
        width={720}
        height={220}
        priority
        draggable={false}
        onError={() => setResolved("/glxy-hero-logo-fallback.svg")}
        className="h-auto w-full max-h-[min(56vw,320px)] object-contain object-left [filter:drop-shadow(0_2px_14px_rgba(0,0,0,0.45))_drop-shadow(0_0_28px_color-mix(in_srgb,var(--brand-yellow)_22%,transparent))] lg:max-h-[min(40vw,300px)] xl:max-h-[340px]"
      />
    </div>
  );
}

/**
 * Logo met linkerkant onder HOME, video met rechterkant onder het laatste item (Frequenties).
 * Padding op de hero-rij = verschil tussen deze bak en de eerste/laatste nav-link in de viewport.
 */
export function GlxyHeroLogoVideo({
  heroLogoSrc,
  homeHlsSrc,
}: {
  heroLogoSrc: string;
  homeHlsSrc: string | null;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [navPads, setNavPads] = useState({ left: 0, right: 0 });

  const measure = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setNavPads({ left: 0, right: 0 });
      return;
    }
    const row = rowRef.current;
    const nav = document.querySelector(".kiss-public-site-header nav");
    const firstLink = nav?.querySelector("a:first-of-type") as HTMLElement | undefined;
    const lastLink = nav?.querySelector("a:last-of-type") as HTMLElement | undefined;
    if (!row || !firstLink || !lastLink) {
      setNavPads({ left: 0, right: 0 });
      return;
    }
    const rowRect = row.getBoundingClientRect();
    const firstL = firstLink.getBoundingClientRect().left;
    const lastR = lastLink.getBoundingClientRect().right;
    setNavPads({
      left: Math.max(0, Math.round(firstL - rowRect.left)),
      right: Math.max(0, Math.round(rowRect.right - lastR)),
    });
  }, []);

  useEffect(() => {
    measure();
    const ro =
      typeof ResizeObserver !== "undefined" && rowRef.current
        ? new ResizeObserver(() => measure())
        : null;
    if (rowRef.current && ro) ro.observe(rowRef.current);
    window.addEventListener("resize", measure);
    const onLoad = () => measure();
    window.addEventListener("load", onLoad);
    const t1 = window.setTimeout(measure, 150);
    const t2 = window.setTimeout(measure, 600);
    let cancelled = false;
    void document.fonts?.ready?.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", onLoad);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [measure]);

  const padStyle: CSSProperties | undefined =
    navPads.left > 0 || navPads.right > 0
      ? { paddingLeft: navPads.left, paddingRight: navPads.right }
      : undefined;

  const videoFrameStyle: CSSProperties = {
    backgroundImage:
      "linear-gradient(135deg, color-mix(in srgb, var(--glxy-hero-video-frame) 88%, white 12%), color-mix(in srgb, var(--brand-primary) 62%, transparent), color-mix(in srgb, var(--glxy-hero-video-frame) 72%, #00000066))",
  };

  return (
    <div
      ref={rowRef}
      className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12 xl:gap-16"
      style={padStyle}
    >
      <div className="flex min-w-0 shrink justify-start">
        <div className="flex w-full max-w-[min(100%,560px)] flex-col items-start text-left lg:max-w-[min(54vw,560px)]">
          <div className="relative w-full">
            <GlxyHeroLogo src={heroLogoSrc} />
          </div>
        </div>
      </div>

      {homeHlsSrc ? (
        <div className="flex min-w-0 shrink-0 justify-end lg:max-w-[min(100%,680px)] lg:flex-1 lg:justify-end">
          <div
            className="pointer-events-none w-full max-w-[min(100%,680px)] rounded-2xl p-[1px] shadow-[0_0_44px_rgba(0,0,0,0.38)]"
            style={videoFrameStyle}
          >
            <div className="pointer-events-auto aspect-video w-full overflow-hidden rounded-2xl bg-black/55 ring-1 ring-white/12">
              <HomeHlsEmbed
                hero
                src={homeHlsSrc}
                title="GLXY TV live video"
                className="h-full min-h-0 !rounded-none !border-0 !shadow-none !ring-0"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
