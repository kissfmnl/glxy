"use client";

const files = [
  "portret_alexwarren.jpg",
  "portret_bensonboone.avif",
  "portret_dualipa.webp",
  "portret_edheeran.avif",
  "portret_harrystyles.jpg",
  "portret_shaboozey.webp",
  "portret_zaralarsson.avif",
  "zang_brunomars.avif",
  "zang_niallhoran.avif",
  "zang_sabrinacarpenter.jpg",
  "zang_sombr.jpeg",
  "zang_tatemcrae.avif",
  "zang_taylorswift.webp",
  // Jocks
  "../Jockfotos/basvanteylingen.png",
  "../Jockfotos/dennisrodrigues.png",
  "../Jockfotos/dimitriskops.png",
  "../Jockfotos/ferryoomen.png",
  "../Jockfotos/quintenvanhilten.png",
  "../Jockfotos/robinboogaarts.png",
  "../Jockfotos/sjoerddegraaff.png",
  "../Jockfotos/stefanbrau.png",
];

function src(name: string) {
  // allow "../Jockfotos/..." as well
  const base = "Website/DJ fotos/";
  const cleaned = name.startsWith("../") ? name.replace(/^\.\.\//, "") : base + name;
  return `/api/assets/${cleaned.split("/").map(encodeURIComponent).join("/")}`;
}

export function ArtistMarqueeBackground() {
  const row1 = files.slice(0, 5);
  const row2 = files.slice(4, 9);
  const row3 = files.slice(8);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white" />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(55,191,191,0.35), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(30,55,90,0.35), transparent 55%)",
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
          <div
            key={f + i}
            className="h-24 w-40 md:h-28 md:w-48 rounded-2xl overflow-hidden bg-black/5 border border-black/5"
          >
            <img
              src={src(f)}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes kiss-marquee-left {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        @keyframes kiss-marquee-right {
          from { transform: translateX(-33.333%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

