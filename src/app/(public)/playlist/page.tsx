import { PlaylistPageClient } from "@/components/public/PlaylistPageClient";
import { amsterdamHour, buildPlaylistDaySelectOptions, formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const KEYS = [
  "PLAYLIST_HERO_KICKER",
  "PLAYLIST_PAGE_TITLE",
  "PLAYLIST_SUBTITLE",
  "PLAYLIST_VOTE_HINT",
  "PLAYLIST_NOW_PLAYED_LABEL",
  "PLAYLIST_HISTORY_SUBTITLE",
] as const;

const DEFAULT_TEXTS = {
  heroKicker: "KISS FM",
  pageTitle: "Playlist",
  subtitle:
    "Kies een dag en uur (standaard nu). Alleen de afgelopen 7 dagen en uren die al voorbij zijn — meest recente uren bovenaan.",
  voteHint: "",
  nowPlayedLabel: "Nu op de radio",
  historySubtitle: "Meest recent bovenaan",
};

export default async function PlaylistPage() {
  let texts = DEFAULT_TEXTS;
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: [...KEYS] } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    texts = {
      heroKicker: map.get("PLAYLIST_HERO_KICKER") || DEFAULT_TEXTS.heroKicker,
      pageTitle: map.get("PLAYLIST_PAGE_TITLE") || DEFAULT_TEXTS.pageTitle,
      subtitle: map.get("PLAYLIST_SUBTITLE") || DEFAULT_TEXTS.subtitle,
      voteHint: map.get("PLAYLIST_VOTE_HINT") || DEFAULT_TEXTS.voteHint,
      nowPlayedLabel: map.get("PLAYLIST_NOW_PLAYED_LABEL") || DEFAULT_TEXTS.nowPlayedLabel,
      historySubtitle: map.get("PLAYLIST_HISTORY_SUBTITLE") || DEFAULT_TEXTS.historySubtitle,
    };
  } catch {
    texts = DEFAULT_TEXTS;
  }

  const dateMax = formatAmsterdamYMD();
  const dayOptions = buildPlaylistDaySelectOptions(7);

  return (
    <PlaylistPageClient
      texts={texts}
      dateMax={dateMax}
      dayOptions={dayOptions}
      initialDate={dateMax}
      initialHour={amsterdamHour()}
    />
  );
}
