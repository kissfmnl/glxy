import Link from "next/link";
import { notFound } from "next/navigation";
import { DjProfileHero } from "@/components/public/DjProfileHero";
import { MOCK_COVER_FALLBACK, MOCK_JOCKS, getMockProgrammingData } from "@/lib/mock/site";

const DAY_LABELS: Record<number, string> = {
  1: "Maandag",
  2: "Dinsdag",
  3: "Woensdag",
  4: "Donderdag",
  5: "Vrijdag",
  6: "Zaterdag",
  7: "Zondag",
};

type Fact = { question: string; answer: string };

export default function DjProfilePage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug).trim().toLowerCase();
  const j = MOCK_JOCKS.find((x) => x.slug === slug);
  if (!j) notFound();

  const { slots } = getMockProgrammingData();
  const baseSlots = slots.filter((s) => s.jock.name === j.name || s.jock.id === j.slug || s.label?.includes(j.name));

  const facts: Fact[] = [
    { question: "Signatuurzin", answer: `"Orbit local, think global."` },
    { question: "Lievelingsgeluid", answer: "Nebula reverb bij zonsopgang." },
  ];

  const weekPreview = [...baseSlots]
    .sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime))
    .filter((s, i, arr) => i === arr.findIndex((x) => x.dayOfWeek === s.dayOfWeek && x.startTime === s.startTime && x.endTime === s.endTime))
    .slice(0, 7);

  const img = j.imagePath;
  const bioText = `${j.name} is een fictieve demo-host voor GLXY Radio — altijd kraakheldere energie uit de galaxy-lounge.`;
  const fewFactsStretch = facts.length > 0 && facts.length <= 2;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-10">
      <Link href="/djs" className="inline-flex items-center gap-2 text-sm font-black text-[#37bfbf] hover:underline">
        <span aria-hidden>←</span>
        <span>Terug naar hosts</span>
      </Link>

      <div className="mt-6">
        <DjProfileHero
          imageUrl={img}
          fallbackLogoUrl={MOCK_COVER_FALLBACK}
          name={j.name}
          focusX={j.imageFocusX * 100}
          focusY={j.imageFocusY * 100}
          bio={bioText}
          facts={facts}
          fewFactsStretch={fewFactsStretch}
        />
      </div>

      <section className="mt-10 rounded-3xl border border-[#cfdeeb] bg-[#f4f8fb] p-5 md:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#1f3f62]/80">Wanneer live (demo)</h2>
        {weekPreview.length === 0 ? (
          <p className="mt-3 text-sm font-bold text-gray-600">Geen vaste slot in de mock-data voor deze host.</p>
        ) : (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {weekPreview.map((s) => (
              <li
                key={`week-${s.id}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#cfdeeb]/80 pb-2 text-sm font-bold text-[#1f3f62] last:border-0 last:pb-0"
              >
                <span className="w-28 shrink-0 font-black">{DAY_LABELS[s.dayOfWeek] ?? `Dag ${s.dayOfWeek}`}</span>
                <span>
                  {s.startTime} – {s.endTime}
                  {s.label ? <span className="font-bold text-gray-600"> · {s.label}</span> : null}
                  {s.coHostName ? <span className="font-bold text-gray-500"> (met {s.coHostName})</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs font-bold text-gray-500">
          <Link href="/programmering" className="text-[#37bfbf] hover:underline">
            Bekijk de volledige programmering
          </Link>
        </p>
      </section>
    </div>
  );
}
