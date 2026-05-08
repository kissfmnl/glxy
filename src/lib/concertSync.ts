import { prisma } from "@/lib/prisma";

type SyncResult = { scanned: number; upserted: number; ignored: number };

const MAJOR_VENUE_HINTS = [
  "ziggo dome",
  "afas live",
  "johan cruijff arena",
  "rotterdam ahoy",
  "gelredome",
  "vorstin",
  "013",
  "poppodium",
  "mainstage",
  "arena",
];

const TITLE_BLOCKLIST = [
  "vip",
  "premium",
  "access",
  "hospitality",
  "platinum",
  "parking",
  "lounge",
  "diner",
  "experience",
  "ticket +",
];

const VENUE_BLOCKLIST = ["premium", "vip", "hospitality", "lounge", "club access"];

function parseEventDate(ev: any): Date | null {
  const iso = String(ev?.dates?.start?.dateTime || "").trim();
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const localDate = String(ev?.dates?.start?.localDate || "").trim();
  if (localDate) {
    const d = new Date(`${localDate}T20:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function shouldKeepEvent(ev: any): boolean {
  const venueName = String(ev?._embedded?.venues?.[0]?.name || "").toLowerCase();
  if (!MAJOR_VENUE_HINTS.some((h) => venueName.includes(h))) return false;
  if (VENUE_BLOCKLIST.some((w) => venueName.includes(w))) return false;
  const title = String(ev?.name || "").toLowerCase();
  if (TITLE_BLOCKLIST.some((w) => title.includes(w))) return false;
  const attractions = Array.isArray(ev?._embedded?.attractions) ? ev._embedded.attractions : [];
  return attractions.length > 0;
}

function primaryArtist(ev: any): string {
  const first = String(ev?._embedded?.attractions?.[0]?.name || "").trim().toLowerCase();
  if (first) return first;
  const n = String(ev?.name || "").toLowerCase();
  return n.split("—")[0].split("-")[0].split(",")[0].trim();
}

function primaryArtistDisplay(ev: any): string {
  const first = String(ev?._embedded?.attractions?.[0]?.name || "").trim();
  if (first) return first;
  const n = String(ev?.name || "").trim();
  return n.split("—")[0].split("-")[0].split(",")[0].trim();
}

function eventKey(ev: any): string {
  const d = parseEventDate(ev);
  const day = d ? d.toISOString().slice(0, 10) : "no-date";
  const venue = String(ev?._embedded?.venues?.[0]?.name || "").trim().toLowerCase();
  return `${primaryArtist(ev)}|${venue}|${day}`;
}

function eventScore(ev: any): number {
  const title = String(ev?.name || "").toLowerCase();
  let score = 100;
  if (TITLE_BLOCKLIST.some((w) => title.includes(w))) score -= 50;
  score -= title.length / 40;
  return score;
}

function logicalDuplicateKey(ev: any): string {
  const d = parseEventDate(ev);
  const day = d ? d.toISOString().slice(0, 10) : "no-date";
  const venue = String(ev?._embedded?.venues?.[0]?.name || "").trim().toLowerCase();
  const artists = Array.isArray(ev?._embedded?.attractions)
    ? ev._embedded.attractions.map((a: any) => String(a?.name || "").trim().toLowerCase()).filter(Boolean)
    : [];
  return `${artists.join("|")}|${venue}|${day}`;
}

export async function syncConcertsFromTicketmaster(): Promise<SyncResult> {
  const key = process.env.TICKETMASTER_API_KEY?.trim();
  if (!key) {
    throw new Error("TICKETMASTER_API_KEY ontbreekt.");
  }
  const apiKey: string = key;

  let scanned = 0;
  let upserted = 0;
  let ignored = 0;
  const dedupGlobal = new Map<string, any>();
  const blocked = new Set(
    (
      await prisma.concertSyncBlock.findMany({
        where: { source: "ticketmaster" },
        select: { externalKey: true },
      })
    ).map((b) => b.externalKey)
  );

  const startDateTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  async function fetchEvents(page: number, lite = false) {
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("countryCode", "NL");
    url.searchParams.set("size", "200");
    url.searchParams.set("sort", "date,asc");
    url.searchParams.set("startDateTime", startDateTime);
    url.searchParams.set("page", String(page));
    if (!lite) {
      url.searchParams.set("classificationName", "music");
    }
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Ticketmaster fout (${res.status})${body ? `: ${body.slice(0, 180)}` : ""}`);
    }
    return res.json();
  }
  for (let page = 0; page < 3; page++) {
    let json: any;
    try {
      json = await fetchEvents(page, false);
    } catch {
      json = await fetchEvents(page, true);
    }
    const eventsRaw = Array.isArray(json?._embedded?.events) ? json._embedded.events : [];
    if (eventsRaw.length === 0) break;
    for (const ev of eventsRaw) {
      const key = eventKey(ev);
      const prev = dedupGlobal.get(key);
      if (!prev || eventScore(ev) > eventScore(prev)) dedupGlobal.set(key, ev);
    }
    const totalPages = Number(json?.page?.totalPages ?? 1);
    if (!Number.isFinite(totalPages) || page + 1 >= totalPages) break;
  }

  const logicalSeen = new Set<string>();
  for (const ev of Array.from(dedupGlobal.values())) {
      scanned += 1;
      const date = parseEventDate(ev);
      const id = String(ev?.id || "").trim();
      const name = String(ev?.name || "").trim();
      if (!id || !name || !date) {
        ignored += 1;
        continue;
      }
      if (!shouldKeepEvent(ev)) {
        ignored += 1;
        continue;
      }
      const logical = logicalDuplicateKey(ev);
      if (logicalSeen.has(logical)) {
        ignored += 1;
        continue;
      }
      logicalSeen.add(logical);

      const venue = String(ev?._embedded?.venues?.[0]?.name || "").trim() || null;
      const city = String(ev?._embedded?.venues?.[0]?.city?.name || "").trim() || null;
      const ticketUrl = String(ev?.url || "").trim() || null;
      const title = `${primaryArtistDisplay(ev)} — Live`;

      const externalKey = `ticketmaster:${id}`;
      if (blocked.has(externalKey)) {
        ignored += 1;
        continue;
      }
      const existing = await prisma.concert.findFirst({
        where: { externalKey },
        select: { id: true },
      });
      if (existing) {
        await prisma.concert.update({
          where: { id: existing.id },
          data: {
            title,
            venue,
            city,
            date,
            url: ticketUrl,
            isActive: true,
            source: "ticketmaster",
            externalKey,
          },
        });
      } else {
        await prisma.concert.create({
          data: {
            externalKey,
            source: "ticketmaster",
            title,
            venue,
            city,
            date,
            url: ticketUrl,
            isActive: true,
          },
        });
      }
      upserted += 1;
  }

  // Cleanup: zet premium/vip-varianten en dubbele actieve ticketmaster records uit.
  await prisma.concert.deleteMany({
    where: {
      source: "ticketmaster",
      OR: [
        { title: { contains: "ziggo dome premium", mode: "insensitive" } },
        { venue: { contains: "ziggo dome premium", mode: "insensitive" } },
      ],
    },
  });

  const upcoming = await prisma.concert.findMany({
    where: {
      source: "ticketmaster",
      date: { gte: new Date() },
      isActive: true,
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, venue: true, city: true, date: true, url: true, createdAt: true },
  });
  const duplicateIds = new Set<string>();
  const chosenByArtist = new Map<string, string>();
  for (const c of upcoming) {
    const venue = String(c.venue || "").toLowerCase();
    const title = String(c.title || "").toLowerCase();
    if (TITLE_BLOCKLIST.some((w) => title.includes(w)) || VENUE_BLOCKLIST.some((w) => venue.includes(w))) {
      duplicateIds.add(c.id);
      continue;
    }
    const artistKey = String(c.title || "")
      .toLowerCase()
      .replace(/\s+—\s+live$/, "")
      .trim();
    if (!artistKey) continue;
    if (chosenByArtist.has(artistKey)) {
      duplicateIds.add(c.id);
      continue;
    }
    chosenByArtist.set(artistKey, c.id);
  }
  if (duplicateIds.size) {
    await prisma.concert.updateMany({
      where: { id: { in: Array.from(duplicateIds) } },
      data: { isActive: false },
    });
  }

  return { scanned, upserted, ignored };
}
