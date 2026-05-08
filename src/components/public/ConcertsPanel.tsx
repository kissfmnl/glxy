import { prisma } from "@/lib/prisma";
import { KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE_ON_DARK } from "@/lib/publicPanelChrome";

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
  let concerts: ConcertRow[] = [];
  try {
    const upcoming = await prisma.concert.findMany({
      where: { isActive: true, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 24,
      select: { id: true, title: true, venue: true, city: true, date: true, url: true },
    });
    if (upcoming.length > 0) {
      concerts = upcoming;
    } else {
      concerts = await prisma.concert.findMany({
        where: { isActive: true },
        orderBy: { date: "desc" },
        take: 24,
        select: { id: true, title: true, venue: true, city: true, date: true, url: true },
      });
    }
  } catch {
    concerts = [];
  }

  const grouped = groupConcertRuns(concerts).slice(0, 4);

  return (
    <div className="kiss-public-panel kiss-public-panel--navy rounded-3xl border border-[#2a496f] bg-[linear-gradient(145deg,#1e375a_0%,#284a75_100%)] text-white overflow-hidden flex flex-col">
      <div className={KISS_PANEL_HEADER_BOX}>
        <p className={KISS_PANEL_TITLE_ON_DARK}>{sectionTitle}</p>
      </div>
      <div className="px-5 pb-5 pt-0">
        <div className={`${KISS_PANEL_HEADER_GAP} space-y-2.5`}>
        {grouped.length ? (
          grouped.map((c) => (
            <a
              key={c.key}
              href={c.url || undefined}
              target={c.url ? "_blank" : undefined}
              rel={c.url ? "noreferrer" : undefined}
              className="kiss-public-concert-row flex flex-col rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur transition-colors hover:bg-white/15"
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
              <p className="mt-1 text-sm font-black text-white truncate">{c.title}</p>
              <p className="text-xs font-bold text-white/80 truncate">{[c.venue, c.city].filter(Boolean).join(" • ")}</p>
            </a>
          ))
        ) : (
          <div className="kiss-public-concert-row rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur">
            <p className="text-sm font-black text-white">Nog geen concerten zichtbaar.</p>
            <p className="mt-1 text-xs font-bold text-white/80">
              Voeg in admin een concert toe en zet het op actief om het hier te tonen.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
