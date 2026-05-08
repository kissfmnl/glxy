import { temporarySlotIsRedundantWithBaseSchedule } from "@/lib/scheduleSlotPresentation";

type CoreSlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type TemporaryWindow = {
  startsOn: Date;
  endsOn: Date;
  isActive: boolean;
};

export function timeToMinutesHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function ymdFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function tempActiveOnYmd(s: TemporaryWindow, todayYmd: string): boolean {
  if (!s.isActive) return false;
  const from = ymdFromDate(s.startsOn);
  const to = ymdFromDate(s.endsOn);
  return todayYmd >= from && todayYmd <= to;
}

/**
 * Combineert vaste + tijdelijke slots voor 1 dag:
 * - actieve tijdelijke slots hebben voorrang op overlappende vaste slots.
 */
type SlotWithPresentation = CoreSlot & {
  jockId: string;
  coHostName?: string | null;
  label?: string | null;
  notes?: string | null;
  programImagePath?: string | null;
};

export function mergeScheduleSlotsForDay<
  TBase extends SlotWithPresentation,
  TTemp extends SlotWithPresentation & TemporaryWindow,
>(baseSlots: TBase[], tempSlots: TTemp[], todayYmd: string, dayOfWeek: number): Array<(TBase & { source: "base" }) | (TTemp & { source: "temp" })> {
  const basesForDay = baseSlots.filter((b) => b.dayOfWeek === dayOfWeek);
  const activeTempCandidates = tempSlots.filter((t) => t.dayOfWeek === dayOfWeek && tempActiveOnYmd(t, todayYmd));

  const activeTemp = activeTempCandidates
    .filter((t) => !temporarySlotIsRedundantWithBaseSchedule(t, basesForDay))
    .map((t) => ({ ...t, source: "temp" as const }));

  const filteredBase = baseSlots
    .filter((b) => b.dayOfWeek === dayOfWeek)
    .filter((b) => {
      const bs = timeToMinutesHHMM(b.startTime);
      const be = timeToMinutesHHMM(b.endTime);
      return !activeTemp.some((t) => {
        const ts = timeToMinutesHHMM(t.startTime);
        const te = timeToMinutesHHMM(t.endTime);
        return rangesOverlap(bs, be, ts, te);
      });
    })
    .map((b) => ({ ...b, source: "base" as const }));

  return [...filteredBase, ...activeTemp].sort((a, b) => {
    const aS = timeToMinutesHHMM(a.startTime);
    const bS = timeToMinutesHHMM(b.startTime);
    if (aS !== bS) return aS - bS;
    if (a.source !== b.source) return a.source === "temp" ? -1 : 1;
    return 0;
  });
}
