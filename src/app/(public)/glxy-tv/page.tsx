import { getBranding } from "@/lib/brandingDb";
import { HomeHlsEmbed } from "@/components/public/HomeHlsEmbed";
import { PublicSimplePage } from "@/components/public/PublicSimplePage";

export const metadata = {
  title: "GLXY TV — GLXY Radio",
};

export default async function GlxyTvPage() {
  const b = await getBranding();
  const src = b.homeHlsUrl;

  return (
    <div className="flex flex-col">
      <PublicSimplePage
        title="GLXY TV"
        intro="Live meekijken met het station. Standaard staat het geluid uit; je kunt het via de videospeler aanzetten."
      />
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 md:px-6">
        {src ? (
          <HomeHlsEmbed src={src} title="GLXY TV live video" className="mx-auto max-w-3xl shadow-2xl" />
        ) : (
          <p className="text-center text-sm text-white/60">Geen stream-URL geconfigureerd.</p>
        )}
      </div>
    </div>
  );
}
