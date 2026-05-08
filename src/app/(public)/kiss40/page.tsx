import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import AppImage from "@/components/AppImage";
import { MOCK_HERO_BACKDROP_PATHS } from "@/lib/mock/site";

export default function Kiss40Page() {
  const description =
    "GLXY40 — onze fictieve countdown-show: elk weekend een neon-trip door de grootste cosmic hits van dit moment.";
  const helpText = "De embed hieronder is een losstaande Spotify-demo-playlist.";
  const headerSrc = MOCK_HERO_BACKDROP_PATHS[0] || "";

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          GLXY40
        </h1>
        <p className="mt-3 max-w-3xl text-gray-600">{description}</p>
        <p className="mt-2 max-w-3xl font-bold text-gray-700">{helpText}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-[#d3dae4] bg-[#eef2f6] p-5 md:p-6">
        <div className="overflow-hidden rounded-2xl border border-cyan-500/25 bg-black/40 p-4 md:p-5">
          {headerSrc ? (
            <AppImage src={headerSrc} alt="" className="h-auto max-h-40 w-full object-cover opacity-95" loading="lazy" />
          ) : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#d6dee8] bg-white">
          <iframe
            title="Demo Spotify playlist embed"
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIG1Y5CtK?utm_source=generator"
            width="100%"
            height={352}
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
