import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGE_INTRO } from "@/lib/publicPageLayout";
import { ThrowbackSongPicker } from "@/components/public/ThrowbackSongPicker";
import { buildTrackKeys, toPublicCoverSrc } from "@/lib/throwbackCovers";

export const dynamic = "force-dynamic";

export default async function ThrowbackActionPage() {
  const [kickerRow, titleRow, subtitleRow] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_KICKER" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_TITLE" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "THROWBACK_STEP1_SUBTITLE" }, select: { value: true } }),
  ]);
  const kicker = kickerRow?.value?.trim() || "Actie";
  const title = titleRow?.value?.trim() || "KISS Throwback Party";
  const subtitle = subtitleRow?.value?.trim() || "Stap 1 van 2: stel je teamplaylist samen.";

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
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { artist: "asc" }, { title: "asc" }],
    select: { id: true, artist: true, title: true, year: true, coverUrl: true },
  });
  const songsWithCover = songs.map((song) => {
    const ownCover = toPublicCoverSrc(song.coverUrl);
    if (ownCover) return { ...song, coverUrl: ownCover };
    const fallback = buildTrackKeys(song.artist, song.title).map((k) => playedCoverByKey.get(k)).find(Boolean) || null;
    return { ...song, coverUrl: fallback };
  });

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-3.5 py-8 sm:px-4 md:px-6">
      <div className={PUBLIC_PAGE_INTRO}>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#365579]">{kicker}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e375a] md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm font-medium text-gray-600">{subtitle}</p>
      </div>
      <div className="mt-8">
        <ThrowbackSongPicker songs={songsWithCover} />
      </div>
    </div>
  );
}
