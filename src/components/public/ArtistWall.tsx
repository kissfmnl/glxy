"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

/**
 * Mark Maakt Media–achtige 3-kolom scroll, nu met vierkante tegels (zijde = kolombreedte).
 * Grotere kolommen + hogere/top-offset buitenbak voor meer verticale bleed binnen de page-clip.
 */
const PATHS = [
  "Website/DJ fotos/portret_dualipa.webp",
  "Website/DJ fotos/portret_harrystyles.jpg",
  "Website/DJ fotos/zang_taylorswift.webp",
  "Website/DJ fotos/portret_bensonboone.avif",
  "Website/DJ fotos/portret_edheeran.avif",
  "Website/DJ fotos/zang_sabrinacarpenter.jpg",
  "Website/DJ fotos/portret_shaboozey.webp",
  "Website/DJ fotos/zang_sombr.jpeg",
];

function assetUrl(p: string) {
  return "/api/assets/" + p.split("/").map(encodeURIComponent).join("/");
}

function fallbackLogoSrc() {
  return `/api/assets/Website/Logo/${encodeURIComponent("KISS BLAUW 5000 X 5000.png.png")}`;
}

export function ArtistWall() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    function onChange() {
      setMobile(mq.matches);
    }
    onChange();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  const urls = PATHS.map(assetUrl);
  const third = Math.ceil(urls.length / 3);
  const base1 = urls.slice(0, third);
  const base2 = urls.slice(third, third * 2);
  const base3 = urls.slice(third * 2);
  const fillColumn = (col: string[]) => {
    if (col.length >= 3) return col;
    if (urls.length === 0) return [fallbackLogoSrc(), fallbackLogoSrc(), fallbackLogoSrc()];
    const next = [...col];
    let i = 0;
    while (next.length < 3) {
      next.push(urls[i % urls.length]);
      i += 1;
    }
    return next;
  };
  const col1 = fillColumn(base1);
  const col2 = fillColumn(base2);
  const col3 = fillColumn(base3);
  const loop = (arr: string[]) => {
    const source = arr.length ? arr : [fallbackLogoSrc()];
    const out: string[] = [];
    while (out.length < 24) {
      out.push(...source);
    }
    return out;
  };

  const loop1 = loop(col1);
  const loop2 = loop(col2);
  const loop3 = loop(col3);

  // Grotere kolommen; tegel = vierkant ⇒ hoogte == colW
  const gap = mobile ? "1.5vw" : "2vw";
  const colW = mobile ? "19vw" : "21vw";
  const outerW = mobile ? "min(80vw, 660px)" : "min(76vw, 1100px)";
  const outerTop = mobile ? "-58%" : "-64%";
  // Tussen vorige (-22/-16) en te ver links (-8/-2): iets meer naar rechts trekt.
  const outerRight = mobile ? "-14%" : "-9%";
  const outerH = mobile ? "235%" : "245%";
  const blurPx = mobile ? 1 : 1.15;

  const rootStyle: CSSProperties = {
    position: "absolute",
    top: outerTop,
    right: outerRight,
    height: outerH,
    width: outerW,
    display: "flex",
    gap,
    transform: mobile ? "none" : "rotate(-12deg) skewY(-5deg)",
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 0,
    opacity: mobile ? 0.78 : 0.84,
    filter: `blur(${blurPx}px)`,
  };

  return (
    <div style={rootStyle}>
      <Column urls={loop1} colW={colW} gap={gap} animation="kiss-scroll-down" duration={150} marginTop={0} />
      <Column
        urls={loop2}
        colW={colW}
        gap={gap}
        animation="kiss-scroll-up"
        duration={200}
        marginTop={mobile ? "-11vw" : "-13vw"}
      />
      <Column
        urls={loop3}
        colW={colW}
        gap={gap}
        animation="kiss-scroll-down"
        duration={250}
        marginTop={mobile ? "3.5vw" : "4.5vw"}
      />
    </div>
  );
}

function Column({
  urls,
  colW,
  gap,
  animation,
  duration,
  marginTop,
}: {
  urls: string[];
  colW: string;
  gap: string;
  animation: string;
  duration: number;
  marginTop: string | number;
}) {
  return (
    <div className="relative overflow-hidden" style={{ width: colW, marginTop }}>
      <div
        className="flex flex-col will-change-transform [transform:translateZ(0)]"
        style={{
          gap,
          animation: `${animation} ${duration}s linear infinite`,
        }}
      >
        {urls.map((src, i) => (
          <div
            key={`${src}-${i}`}
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              height: "auto",
              borderRadius: "min(1.4vw, 14px)",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
              backgroundColor: "white",
              transform: "skewY(5deg)",
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "grayscale(20%) contrast(1.1)",
                userSelect: "none",
              }}
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.includes("KISS%20BLAUW%205000%20X%205000.png.png")) return;
                img.src = fallbackLogoSrc();
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
