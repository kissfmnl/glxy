import type { HomeHeroHeadlineSlot } from "@prisma/client";
import { amsterdamWeekdayISO } from "@/lib/amsterdamClock";

type SlotPick = Pick<
  HomeHeroHeadlineSlot,
  | "startsOn"
  | "endsOn"
  | "weekdays"
  | "startTime"
  | "endTime"
  | "titleLine1"
  | "titleLine2"
  | "titleLine1Color"
  | "titleLine2Color"
  | "priority"
  | "isActive"
>;

function ymdFromDbDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function hhmmToMinutes(v: string | null | undefined): number | null {
  if (!v?.trim()) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

/** `todayYmd` = YYYY-MM-DD in Europe/Amsterdam (via formatAmsterdamYMD). */
function slotAllowsWeekday(weekdaysCsv: string | null | undefined, todayYmd: string): boolean {
  const raw = weekdaysCsv?.trim();
  if (!raw) return true;
  const allowed = new Set(
    raw
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => n >= 1 && n <= 7)
  );
  if (allowed.size === 0) return true;
  return allowed.has(amsterdamWeekdayISO(todayYmd));
}

/** Voor admin-UI: geldt deze geplande titel op `todayYmd` (YYYY-MM-DD, Amsterdam)? */
export function heroSlotAppliesOnYmd(
  s: {
    startsOn: string;
    endsOn: string;
    weekdays: string | null;
    startTime?: string | null;
    endTime?: string | null;
    isActive: boolean;
  },
  todayYmd: string,
  nowMinutes = 12 * 60
): boolean {
  if (!s.isActive) return false;
  const a = s.startsOn.slice(0, 10);
  const b = s.endsOn.slice(0, 10);
  if (todayYmd < a || todayYmd > b) return false;
  if (!slotAllowsWeekday(s.weekdays, todayYmd)) return false;
  const from = hhmmToMinutes(s.startTime ?? null);
  const to = hhmmToMinutes(s.endTime ?? null);
  if (from === null || to === null) return true;
  if (to <= from) return nowMinutes >= from || nowMinutes < to;
  return nowMinutes >= from && nowMinutes < to;
}

export function pickHomeHeroHeadlineSlot(slots: SlotPick[], todayYmd: string, nowMinutes = 12 * 60): SlotPick | null {
  const candidates = slots.filter((s) => {
    if (!s.isActive) return false;
    const a = ymdFromDbDate(s.startsOn);
    const b = ymdFromDbDate(s.endsOn);
    if (todayYmd < a || todayYmd > b) return false;
    if (!slotAllowsWeekday(s.weekdays, todayYmd)) return false;
    const from = hhmmToMinutes(s.startTime);
    const to = hhmmToMinutes(s.endTime);
    if (from === null || to === null) return true;
    if (to <= from) return nowMinutes >= from || nowMinutes < to;
    return nowMinutes >= from && nowMinutes < to;
  });
  candidates.sort((x, y) => y.priority - x.priority);
  return candidates[0] ?? null;
}
