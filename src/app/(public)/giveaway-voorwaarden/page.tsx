import { DEFAULT_GIVEAWAY_TERMS_BULLETS, websiteTextGroups } from "@/lib/websiteTextsConfig";
import { PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";

function fallbackForKey(key: string): string {
  for (const g of websiteTextGroups) {
    for (const raw of g.items) {
      if (raw.key === key) return raw.fallback;
    }
  }
  return "";
}

export default function GiveawayTermsPage() {
  const title = fallbackForKey("GIVEAWAY_TERMS_PAGE_TITLE") || "Giveaway-voorwaarden (demo)";
  const bulletsRaw = fallbackForKey("GIVEAWAY_TERMS_BULLETS") || DEFAULT_GIVEAWAY_TERMS_BULLETS;

  const bullets = bulletsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className={`${PUBLIC_PAGE_SHELL} flex flex-col items-center text-center`}>
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          {title}
        </h1>
      </div>

      <div className="mt-8 w-full max-w-3xl rounded-3xl border border-[#cfdeeb] bg-white p-6 text-left shadow-[0_2px_24px_rgba(30,55,90,0.06)] md:p-8">
        <ul className="list-disc space-y-4 pl-5 text-[15px] leading-relaxed text-gray-700 md:text-base">
          {bullets.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
