import { PlaylistPageClient } from "@/components/public/PlaylistPageClient";
import { amsterdamHour, buildPlaylistDaySelectOptions, formatAmsterdamYMD } from "@/lib/amsterdamClock";

const DEFAULT_TEXTS = {
  heroKicker: "GLXY Radio",
  pageTitle: "Playlist",
  subtitle:
    "Kies een dag en uur (standaard nu). Demo-modus — data is vast en verandert niet met een echte zendlijst.",
  voteHint: "Stemmen worden alleen in je browser bijgehouden (demo).",
  nowPlayedLabel: "Nu op de radio",
  historySubtitle: "Meest recent bovenaan",
};

export default function PlaylistPage() {
  const dateMax = formatAmsterdamYMD();
  const dayOptions = buildPlaylistDaySelectOptions(7);

  return (
    <PlaylistPageClient
      texts={DEFAULT_TEXTS}
      dateMax={dateMax}
      dayOptions={dayOptions}
      initialDate={dateMax}
      initialHour={amsterdamHour()}
    />
  );
}
