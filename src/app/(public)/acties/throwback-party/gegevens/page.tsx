import Link from "next/link";
import { redirect } from "next/navigation";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import { ThrowbackSubmissionDetailsForm } from "@/components/public/ThrowbackSubmissionDetailsForm";
import { MOCK_THROWBACK_SONGS } from "@/lib/mock/site";

export default function ThrowbackPartyDetailsPage({
  searchParams,
}: {
  searchParams?: { songIds?: string; submitted?: string; free?: string };
}) {
  const kicker = "Actie · demo";
  const title = "GLXY Throwback Mix";
  const step2Subtitle = "Stap 2 van 2: vul je gegevens in (demo — er wordt niets opgeslagen).";
  const successTitle = "Top! In een echte omgeving zou je inzending hier binnenkomen.";
  const successCta = "Nieuwe selectie";
  const backCta = "← Terug naar nummerselectie";
  const audioHelpText = "Audio is optioneel in deze demo.";
  const videoHelpText = "Video is optioneel in deze demo.";

  if (searchParams?.submitted === "1") {
    return (
      <div className={PUBLIC_PAGE_SHELL}>
        <div className={PUBLIC_PAGE_INTRO}>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#365579]">{kicker}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e375a] md:text-4xl">{title}</h1>
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-black text-emerald-800">{successTitle}</p>
          <Link
            href="/throwback"
            className="mt-3 inline-flex rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-800"
          >
            {successCta}
          </Link>
        </div>
      </div>
    );
  }

  const requestedIds = String(searchParams?.songIds || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const dedupedIds = Array.from(new Set(requestedIds));
  const freeRaw = Number(String(searchParams?.free || "0").trim());
  const freeChoiceCount = Number.isFinite(freeRaw) ? Math.max(0, Math.min(4, Math.trunc(freeRaw))) : 0;
  const totalCount = dedupedIds.length + freeChoiceCount;
  if (totalCount < 6 || totalCount > 10) {
    redirect("/throwback");
  }

  const byId = new Map(MOCK_THROWBACK_SONGS.map((s) => [s.id, s]));
  const orderedSongs = dedupedIds
    .map((id) => byId.get(id))
    .filter((song): song is NonNullable<typeof song> => Boolean(song));
  if (orderedSongs.length + freeChoiceCount < 6 || orderedSongs.length + freeChoiceCount > 10) {
    redirect("/throwback");
  }

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#365579]">{kicker}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e375a] md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm font-medium text-gray-600">{step2Subtitle}</p>
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <Link href="/throwback" className="inline-flex rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700">
            {backCta}
          </Link>
        </div>
        <ThrowbackSubmissionDetailsForm
          songs={orderedSongs}
          freeChoiceCount={freeChoiceCount}
          audioHelpText={audioHelpText}
          videoHelpText={videoHelpText}
        />
      </div>
    </div>
  );
}
