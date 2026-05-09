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
    <AppImage
      src={resolved}
      alt="GLXY"
      width={720}
      height={220}
      priority
      onError={() => setResolved("/glxy-hero-logo-fallback.svg")}
      className="h-auto w-full max-h-[min(52vw,280px)] object-contain object-left [filter:drop-shadow(0_10px_40px_rgba(34,211,238,0.42))_drop-shadow(0_6px_32px_rgba(11,117,87,0.45))] lg:max-h-[min(36vw,280px)] xl:max-h-[300px]"
    />
  );
}

/**
 * Logo links, video rechts; op lg wordt video naar links gezet zodat de rechterrand
 * uitlijnt met het einde van het laatste menulink (niet met de social-iconen).
 */
export function GlxyHeroLogoVideo({
  heroLogoSrc,
  homeHlsSrc,
}: {
  heroLogoSrc: string;
  homeHlsSrc: string | null;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [videoMarginRight, setVideoMarginRight] = useState(0);

  const measure = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setVideoMarginRight(0);
      return;
    }
    const row = rowRef.current;
    const nav = document.querySelector(".kiss-public-site-header nav");
    const lastLink = nav?.querySelector("a:last-of-type") as HTMLElement | undefined;
    if (!row || !lastLink) {
      setVideoMarginRight(0);
      return;
    }
    const rowR = row.getBoundingClientRect().right;
    const navR = lastLink.getBoundingClientRect().right;
    setVideoMarginRight(Math.max(0, Math.round(rowR - navR)));
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

  return (
    <div ref={rowRef} className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center lg:gap-3 xl:gap-4">
      <div className="flex min-w-0 justify-start lg:justify-end">
        <div className="flex w-full max-w-[min(100%,520px)] flex-col items-start text-left lg:max-w-[min(52vw,520px)]">
          <div className="relative w-full">
            <GlxyHeroLogo src={heroLogoSrc} />
          </div>
        </div>
      </div>

      {homeHlsSrc ? (
        <div
          className="flex min-w-0 justify-start lg:justify-start"
          style={videoMarginRight > 0 ? ({ marginRight: videoMarginRight } satisfies CSSProperties) : undefined}
        >
          <div className="pointer-events-none w-full max-w-[min(100%,880px)] rounded-2xl bg-gradient-to-br from-cyan-300/50 via-emerald-700/45 to-fuchsia-400/38 p-[1px] shadow-[0_0_56px_rgba(11,117,87,0.34),0_28px_56px_rgba(0,0,0,0.38)]">
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
