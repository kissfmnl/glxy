import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DjProfileHero } from "@/components/public/DjProfileHero";
import { websiteAssetUrl } from "@/lib/websiteAssetUrl";

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<number, string> = {
  1: "Maandag",
  2: "Dinsdag",
  3: "Woensdag",
  4: "Donderdag",
  5: "Vrijdag",
  6: "Zaterdag",
  7: "Zondag",
};

function fallbackLogoSrc() {
  return `/api/assets/Website/Logo/${encodeURIComponent("KISS BLAUW 5000 X 5000.png.png")}`;
}

type Fact = { question: string; answer: string };

function parseFacts(json: string | null | undefined): Fact[] {
  if (!json?.trim()) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((row: any) => ({
        question: String(row?.question ?? "").trim(),
        answer: String(row?.answer ?? "").trim(),
      }))
      .filter((f) => f.question || f.answer);
  } catch {
    return [];
  }
}

export default async function DjProfilePage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug).trim().toLowerCase();
  const jock = await prisma.jock.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      imagePath: true,
      profileImagePath: true,
      imageFocusX: true,
      imageFocusY: true,
      profileFocusX: true,
      profileFocusY: true,
      bioText: true,
      personalFactsJson: true,
    },
  });

  if (!jock) notFound();

  const baseSlots = await prisma.scheduleSlot.findMany({
    where: {
      OR: [{ jockId: jock.id }, { coHostName: { equals: jock.name, mode: "insensitive" } }],
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  const facts = parseFacts(jock.personalFactsJson);
  const img = websiteAssetUrl(jock.profileImagePath || jock.imagePath);
  const weekPreview = [...baseSlots]
    .sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime))
    .filter((s, i, arr) => i === arr.findIndex((x) => x.dayOfWeek === s.dayOfWeek && x.startTime === s.startTime && x.endTime === s.endTime))
    .slice(0, 7);
  const fewFactsStretch = facts.length > 0 && facts.length <= 2;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-10">
      <Link href="/djs" className="inline-flex items-center gap-2 text-sm font-black text-[#37bfbf] hover:underline">
        <span aria-hidden>←</span>
        <span>Terug naar DJ’s</span>
      </Link>

      <div className="mt-6">
        <DjProfileHero
          imageUrl={img}
          fallbackLogoUrl={fallbackLogoSrc()}
          name={jock.name}
          focusX={jock.profileImagePath ? jock.profileFocusX : jock.imageFocusX}
          focusY={jock.profileImagePath ? jock.profileFocusY : jock.imageFocusY}
          bio={jock.bioText ?? ""}
          facts={facts}
          fewFactsStretch={fewFactsStretch}
        />
      </div>

      <section className="mt-10 rounded-3xl border border-[#cfdeeb] bg-[#f4f8fb] p-5 md:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#1f3f62]/80">Wanneer op de radio</h2>
        {weekPreview.length === 0 ? (
          <p className="mt-3 text-sm font-bold text-gray-600">Geen vaste tijden ingevuld voor deze DJ.</p>
        ) : (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {weekPreview.map((s) => (
              <li
                key={`week-${s.id}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm font-bold text-[#1f3f62] border-b border-[#cfdeeb]/80 last:border-0 pb-2 last:pb-0"
              >
                <span className="font-black w-28 shrink-0">{DAY_LABELS[s.dayOfWeek] ?? `Dag ${s.dayOfWeek}`}</span>
                <span>
                  {s.startTime} – {s.endTime}
                  {s.label ? <span className="text-gray-600 font-bold"> · {s.label}</span> : null}
                  {s.coHostName ? <span className="text-gray-500 font-bold"> (met {s.coHostName})</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-gray-500 font-bold">
          <Link href="/programmering" className="text-[#37bfbf] hover:underline">
            Bekijk de volledige programmering
          </Link>
        </p>
      </section>

      {!jock.bioText?.trim() && facts.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500 font-bold">Meer persoonlijke info volgt binnenkort.</p>
      ) : null}
    </div>
  );
}
