/** Datums/tijden voor playlistfilters in Europe/Amsterdam. */

const TZ = "Europe/Amsterdam";

/** YYYY-MM-DD in Amsterdam op het gegeven moment (of nu). */
export function formatAmsterdamYMD(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** ISO weekdag 1 = maandag … 7 = zondag voor kalenderdag `ymd` (YYYY-MM-DD) in Europe/Amsterdam. */
export function amsterdamWeekdayISO(ymd: string): number {
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!y || !mo || !d) return 1;
  const ref = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const w = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(ref);
  const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  const i = order.findIndex((x) => w.startsWith(x));
  const js = i < 0 ? 1 : i;
  return js === 0 ? 7 : js;
}

/** Uur 0–23 in Amsterdam. */
export function amsterdamHour(d: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "numeric",
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value;
  const n = parseInt(h || "0", 10);
  return Number.isNaN(n) ? 0 : Math.min(23, Math.max(0, n));
}

/** Minuten sinds middernacht in Amsterdam. */
export function amsterdamMinutesOfDay(d: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const hh = Number.isNaN(h) ? 0 : Math.min(23, Math.max(0, h));
  const mm = Number.isNaN(m) ? 0 : Math.min(59, Math.max(0, m));
  return hh * 60 + mm;
}

/**
 * Vroegste toegestane dag voor playlist (vandaag − (days−1)), benaderd via ms;
 * goed genoeg voor een 7-daags venster.
 */
export function playlistHistoryMinYMD(allowedDays = 7): string {
  const ms = Date.now() - (allowedDays - 1) * 24 * 60 * 60 * 1000;
  return formatAmsterdamYMD(new Date(ms));
}

/** Laatste `count` unieke kalenderdagen (Amsterdam), nieuwste eerst. */
export function recentAmsterdamDayYMDs(count = 7): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = 0; i < count * 3 && out.length < count; i++) {
    const ymd = formatAmsterdamYMD(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    if (!seen.has(ymd)) {
      seen.add(ymd);
      out.push(ymd);
    }
  }
  return out;
}

/** Labels voor playlist-dagkiezer: Vandaag, Gisteren, daarna weekday + datum. */
export function playlistDayOptionLabel(ymd: string, index: number): string {
  if (index === 0) return "Vandaag";
  if (index === 1) return "Gisteren";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0);
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(utcNoon));
}

export function buildPlaylistDaySelectOptions(count = 7): { ymd: string; label: string }[] {
  const ymds = recentAmsterdamDayYMDs(count);
  return ymds.map((ymd, i) => ({ ymd, label: playlistDayOptionLabel(ymd, i) }));
}
