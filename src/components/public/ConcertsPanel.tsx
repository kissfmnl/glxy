import Link from "next/link";
import { KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE_ON_DARK } from "@/lib/publicPanelChrome";
import { MOCK_CONCERTS } from "@/lib/mock/site";

type ConcertRow = {
  id: string;
  title: string;
  venue: string | null;
  city: string | null;
  date: Date;
  url?: string | null;
};

type GroupedConcert = {
  key: string;
  title: string;
  venue: string | null;
  city: string | null;
  start: Date;
  end: Date;
  url: string | null;
};

function dayKey(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function groupConcertRuns(input: ConcertRow[]): GroupedConcert[] {
  const sorted = [...input].sort((a, b) => a.date.getTime() - b.date.getTime());
  const groups: GroupedConcert[] = [];
  for (const c of sorted) {
    const prev = groups[groups.length - 1];
    const sameMeta =
      prev &&
      prev.title.toLowerCase() === c.title.toLowerCase() &&
      (prev.venue || "").toLowerCase() === (c.venue || "").toLowerCase() &&
      (prev.city || "").toLowerCase() === (c.city || "").toLowerCase();
    const isNextDay = prev && dayKey(c.date) === dayKey(addDays(prev.end, 1));
    if (sameMeta && isNextDay) {
      prev.end = c.date;
      if (!prev.url && c.url) prev.url = c.url;
      continue;
    }
    groups.push({
      key: c.id,
      title: c.title,
      venue: c.venue,
      city: c.city,
      start: c.date,
      end: c.date,
      url: c.url || null,
    });
  }
  return groups;
}

export async function ConcertsPanel({ sectionTitle = "Concerten" }: { sectionTitle?: string }) {
  const now = new Date();
  const concerts: ConcertRow[] = MOCK_CONCERTS.map((c, i) => ({
    id: c.id,
    title: c.name,
    venue: null,
    city: c.city,
    date: new Date(now.getFullYear(), 6 + (i % 3), 12 + i * 2),
    url: c.url,
  }));

  const grouped = groupConcertRuns(concerts).slice(0, 4);

  return (
    <div className="kiss-public-panel kiss-public-panel--navy galaxy-concerts-panel flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(155deg,#0f1729_0%,#141d35_42%,#0b1022_100%)] text-white">
      <div className={KISS_PANEL_HEADER_BOX}>
        <p className={KISS_PANEL_TITLE_ON_DARK}>{sectionTitle}</p>
      </div>
      <div className="px-5 pb-5 pt-0">
        <div className={`${KISS_PANEL_HEADER_GAP} space-y-2.5`}>
          {grouped.length ? (
            grouped.map((c) => (
              <Link
                key={c.key}
                href={c.url && c.url !== "#" ? c.url : "#"}
                {...(c.url && c.url !== "#" ? { target: "_blank", rel: "noreferrer" } : {})}
                className="kiss-public-concert-row flex flex-col rounded-2xl border border-white/12 bg-white/8 px-3 py-3 backdrop-blur transition-colors hover:bg-white/12"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">
                  {dayKey(c.start) === dayKey(c.end)
                    ? new Intl.DateTimeFormat("nl-NL", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/Amsterdam",
                      }).format(new Date(c.start))
                    : `${new Intl.DateTimeFormat("nl-NL", {
                        day: "numeric",
                        month: "long",
                        timeZone: "Europe/Amsterdam",
                      }).format(new Date(c.start))} t/m ${new Intl.DateTimeFormat("nl-NL", {
                        day: "numeric",
                        month: "long",
                        timeZone: "Europe/Amsterdam",
                      }).format(new Date(c.end))}`}
                </p>
                <p className="mt-1 truncate text-sm font-black text-white">{c.title}</p>
                <p className="truncate text-xs font-bold text-white/80">{[c.venue, c.city].filter(Boolean).join(" • ")}</p>
              </Link>
            ))
          ) : (
            <div className="kiss-public-concert-row rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur">
              <p className="text-sm font-black text-white">Nog geen concerten voor deze demo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
