"use client";

import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK, MOCK_JOCKS, MOCK_PLAYED_TRACKS } from "@/lib/mock/site";

const urls = [
  ...MOCK_JOCKS.map((j) => j.imagePath),
  ...MOCK_PLAYED_TRACKS.map((t) => t.cover).filter(Boolean),
  ...MOCK_JOCKS.map((j) => j.imagePath),
] as string[];

function src(u: string) {
  if (/^https?:\/\//i.test(u)) return u;
  return MOCK_COVER_FALLBACK;
}

export function ArtistMarqueeBackground() {
  const row1 = urls.slice(0, 5);
  const row2 = urls.slice(4, 9);
  const row3 = urls.slice(8);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white" />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(56,189,248,0.35), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(147,51,234,0.25), transparent 55%)",
        }}
      />

      <div className="absolute inset-x-0 top-20 grid gap-6 px-4">
        <MarqueeRow direction="left" images={row1} />
        <MarqueeRow direction="right" images={row2} />
        <MarqueeRow direction="left" images={row3} />
      </div>
    </div>
  );
}

function MarqueeRow({
  images,
  direction,
}: {
  images: string[];
  direction: "left" | "right";
}) {
  const duration = 40;
  const animName = direction === "left" ? "kiss-marquee-left" : "kiss-marquee-right";

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex gap-6 will-change-transform"
        style={{
          animation: `${animName} ${duration}s linear infinite`,
        }}
      >
        {[...images, ...images, ...images].map((f, i) => (
          <div key={f + i} className="h-24 w-40 md:h-28 md:w-48 rounded-2xl overflow-hidden bg-black/5 border border-black/5">
            <AppImage src={src(f)} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes kiss-marquee-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-33.333%);
          }
        }
        @keyframes kiss-marquee-right {
          from {
            transform: translateX(-33.333%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
