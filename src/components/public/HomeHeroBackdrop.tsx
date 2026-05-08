"use client";

import { useEffect, useMemo, useState } from "react";

type Slide = { src: string };

function padSlides(slides: Slide[], min: number): Slide[] {
  if (slides.length === 0) return [];
  const out = [...slides];
  let guard = 0;
  while (out.length < min && guard < 30) {
    out.push(...slides);
    guard += 1;
  }
  return out.slice(0, min);
}

function useMosaicCols() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const read = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1024;
      if (w >= 1024) setCols(8);
      else if (w >= 640) setCols(6);
      else setCols(3);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return cols;
}

/**
 * Hero-achtergrond: **rijen** die horizontaal schuiven (achter de blur).
 * `motionEnabled`: website-teksten Homepagina: collage schuivende rijen.
 */
export function HomeHeroBackdrop({ slides, motionEnabled = true }: { slides: Slide[]; motionEnabled?: boolean }) {
  const cols = useMosaicCols();
  const cells = useMemo(() => padSlides(slides, 24), [slides]);

  const rows = useMemo(() => {
    const out: Slide[][] = [];
    const total = cells.length;
    if (total === 0) return out;
    const numRows = Math.ceil(total / cols);
    for (let r = 0; r < numRows; r++) {
      const row: Slide[] = [];
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        row.push(cells[i % total]);
      }
      out.push(row);
    }
    return out;
  }, [cells, cols]);

  if (slides.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <div className="absolute inset-0 flex flex-col gap-2.5 p-1.5 sm:p-2 md:p-3 opacity-[0.62]">
        {rows.map((row, ri) => {
          const loop = [...row, ...row, ...row];
          const duration = 88 + ri * 18;
          const dir = ri % 2 === 0 ? "l" : "r";
          const phase = (duration * 0.32 + ri * 13.7) % duration;
          return (
            <div
              key={ri}
              className="relative min-h-[3.25rem] flex-1 overflow-hidden rounded-[1.35rem] sm:min-h-0 sm:rounded-[1.45rem] md:rounded-[1.55rem]"
            >
              <div
                className={`flex h-full w-max flex-nowrap gap-2.5 sm:gap-2.5 md:gap-3 ${
                  motionEnabled ? (dir === "l" ? "kiss-home-hero-row-track--l" : "kiss-home-hero-row-track--r") : ""
                }`}
                style={
                  motionEnabled
                    ? { animationDuration: `${duration}s`, animationDelay: `-${phase.toFixed(2)}s` }
                    : {
                        animation: "none",
                        transform: dir === "l" ? "translate3d(-11%,0,0)" : "translate3d(-22%,0,0)",
                      }
                }
              >
                {loop.map((s, ii) => (
                  <div
                    key={`${s.src}-${ri}-${ii}`}
                    className="relative h-full w-[28vw] max-w-[10.25rem] shrink-0 overflow-hidden rounded-2xl sm:w-[132px] md:w-[150px]"
                  >
                    <img src={s.src} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[inherit]"
                      style={{
                        boxShadow: "inset 0 0 16px 8px rgba(12, 31, 51, 0.18)",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
