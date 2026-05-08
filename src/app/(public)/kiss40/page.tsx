import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";

export default function Kiss40Page() {
  return <Kiss40PageContent />;
}

async function KISS40Description() {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "KISS40_DESCRIPTION" },
      select: { value: true },
    });
    return (
      row?.value ||
      "Elk weekend vanaf 16:00 uur hoor je Bas van Teylingen met de 40 grootste hits van het moment in de KISS40. Samengesteld door jou via de KISS app, website en sociale media."
    );
  } catch {
    return "Elk weekend vanaf 16:00 uur hoor je Bas van Teylingen met de 40 grootste hits van het moment in de KISS40. Samengesteld door jou via de KISS app, website en sociale media.";
  }
}

async function Kiss40PageContent() {
  const logoSrc = `/api/assets/${["Website", "KISS40.png"].map(encodeURIComponent).join("/")}`;
  const description = await KISS40Description();
  let helpText = "Benieuwd naar de lijst van deze week? Check 'm hieronder!";
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "KISS40_HELP_TEXT" },
      select: { value: true },
    });
    helpText = row?.value || helpText;
  } catch {}

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--brand-navy)" }}>
          KISS40
        </h1>
        <p className="mt-3 text-gray-600 max-w-3xl">{description}</p>
        <p className="mt-2 text-gray-700 font-bold max-w-3xl">{helpText}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-[#d3dae4] bg-[#eef2f6] p-5 md:p-6">
        <div className="rounded-2xl border border-[#2a496f] bg-[#1e375a] p-4 md:p-5">
          <img src={logoSrc} alt="KISS40" className="w-full h-auto max-h-24 object-contain" loading="lazy" />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#d6dee8] bg-white">
          <iframe
            title="KISS40 Spotify playlist"
            src="https://open.spotify.com/embed/playlist/0GPgveHzxptXDqUQWm8JtM?utm_source=generator"
            width="100%"
            height={2210}
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

