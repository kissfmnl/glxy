"use client";

import { useCallback, useState } from "react";
import AppImage from "@/components/AppImage";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export function HomeDjAvatarRow({
  photos,
  variant = "card",
}: {
  photos: { src: string; alt: string }[];
  /** hero = op donkere achtergrond (hoger contrast) */
  variant?: "card" | "hero";
}) {
  const [broken, setBroken] = useState<Record<number, boolean>>({});

  const onFail = useCallback((i: number) => {
    setBroken((b) => ({ ...b, [i]: true }));
  }, []);

  if (photos.length === 0) return null;

  const labelClass =
    variant === "hero"
      ? "text-center text-[10px] font-black uppercase tracking-[0.28em] text-white/85 mb-3 drop-shadow-sm"
      : "text-center text-[10px] font-black uppercase tracking-[0.28em] text-[#1e375a]/45 mb-3";

  const wrapClass = variant === "hero" ? "w-full max-w-4xl mx-auto px-2" : "w-full max-w-md mx-auto px-2";

  return (
    <div className={wrapClass}>
      <p className={labelClass}>Onze stemmen op KISS</p>
      <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3">
        {photos.slice(0, variant === "hero" ? 12 : 8).map((p, i) => (
          <div
            key={`${p.src}-${i}`}
            className="relative rounded-full border-[3px] border-white shadow-[0_6px_18px_rgba(30,55,90,0.12)] overflow-hidden w-[52px] h-[52px] sm:w-14 sm:h-14 shrink-0 bg-[#1e375a] flex items-center justify-center"
            title={p.alt}
          >
            {broken[i] ? (
              <span className="text-[11px] font-black text-white/95 leading-none text-center px-1">{initialsFromName(p.alt)}</span>
            ) : (
              <AppImage
                src={p.src}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => onFail(i)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
