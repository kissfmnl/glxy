import Link from "next/link";
import { PublicSimplePage } from "@/components/public/PublicSimplePage";
import { MOCK_SOCIAL } from "@/lib/mock/site";

export const metadata = { title: "Radioplayer — GLXY Radio" };

export default function RadioplayerPage() {
  return (
    <PublicSimplePage
      title="Radioplayer"
      intro="Luister live naar GLXY Radio. Onderaan elke pagina staat de vaste mini-player; hier vind je de stream ook direct."
    >
      <p>
        <Link href={MOCK_SOCIAL.streamUrl} className="font-black text-[var(--brand-primary)] underline-offset-2 hover:underline">
          Open stream (demo-URL)
        </Link>{" "}
        — vervang in productie door je echte icecast/shoutcast/HLS-stream via instellingen.
      </p>
      <p className="text-white/55">
        Tip: gebruik de bediening rechtsonder op de site voor play/pause en volume.
      </p>
    </PublicSimplePage>
  );
}
