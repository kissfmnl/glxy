import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import { ThrowbackSubmissionDetailsForm } from "@/components/public/ThrowbackSubmissionDetailsForm";
import { buildTrackKeys, toPublicCoverSrc } from "@/lib/throwbackCovers";

export const dynamic = "force-dynamic";

export default async function ThrowbackPartyDetailsPage({
  searchParams,
}: {
  searchParams?: { songIds?: string; submitted?: string; free?: string };
}) {
  const [kickerRow, titleRow, step2SubtitleRow, successTitleRow, successCtaRow, backCtaRow] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_KICKER" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_TITLE" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_STEP2_SUBTITLE" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_SUCCESS_TITLE" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_SUCCESS_CTA" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_BACK_CTA" }, select: { value: true } }),
  ]);
  const kicker = kickerRow?.value?.trim() || "Actie";
  const title = titleRow?.value?.trim() || "KISS Throwback Party";
  const step2Subtitle = step2SubtitleRow?.value?.trim() || "Stap 2 van 2: vul je gegevens in en verstuur je inzending.";
  const successTitle = successTitleRow?.value?.trim() || "Top! Jullie inzending is ontvangen.";
  const successCta = successCtaRow?.value?.trim() || "Nieuwe inzending starten";
  const backCta = backCtaRow?.value?.trim() || "← Terug naar nummerselectie";

  const [audioHelpRow, videoHelpRow] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "ACTION_THROWBACK_AUDIO_HELP" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTION_THROWBACK_VIDEO_HELP" }, select: { value: true } }),
  ]);
  const audioHelpText =
    audioHelpRow?.value || "Stuur een korte shoutout namens je team (max 20MB, mp3/wav/m4a/webm/ogg).";
  const videoHelpText =
    videoHelpRow?.value || "Stuur een korte video van jullie team (max 100MB, mp4/webm/mov/avi).";

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

  const played = await prisma.playedTrack.findMany({
    where: { cover: { not: null } },
    orderBy: { playedAt: "desc" },
    take: 4000,
    select: { artist: true, title: true, cover: true },
  });
  const playedCoverByKey = new Map<string, string>();
  for (const row of played) {
    const cover = toPublicCoverSrc(row.cover);
    if (!cover) continue;
    for (const key of buildTrackKeys(row.artist, row.title)) {
      if (!playedCoverByKey.has(key)) playedCoverByKey.set(key, cover);
    }
  }

  const songs = await prisma.throwbackSong.findMany({
    where: { id: { in: dedupedIds }, isActive: true },
    select: { id: true, artist: true, title: true, year: true, coverUrl: true },
  });
  const byId = new Map(songs.map((s) => [s.id, s]));
  const orderedSongs = dedupedIds
    .map((id) => byId.get(id))
    .filter((song): song is NonNullable<typeof song> => Boolean(song))
    .map((song) => {
      const ownCover = toPublicCoverSrc(song.coverUrl);
      if (ownCover) return { ...song, coverUrl: ownCover };
      const fallback = buildTrackKeys(song.artist, song.title).map((k) => playedCoverByKey.get(k)).find(Boolean) || null;
      return { ...song, coverUrl: fallback };
    });
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
        <ThrowbackSubmissionDetailsForm songs={orderedSongs} freeChoiceCount={freeChoiceCount} audioHelpText={audioHelpText} videoHelpText={videoHelpText} />
      </div>
    </div>
  );
}
