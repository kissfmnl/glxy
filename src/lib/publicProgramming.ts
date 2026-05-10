import type { PublicBranding } from "@/lib/brandingDb";
import {
  getMockProgrammingData,
  MOCK_JOCKS,
  type MockProgrammingSlot,
} from "@/lib/mock/site";

type ScheduleRow = {
  id?: string;
  weekday?: number;
  dayOfWeek?: number;
  startHm?: string;
  startTime?: string;
  endHm?: string;
  endTime?: string;
  showName?: string;
  label?: string;
  djName?: string | null;
  notes?: string | null;
  programImagePath?: string | null;
};

function rowToSlot(row: ScheduleRow, fallbackIndex: number): MockProgrammingSlot | null {
  const day = row.weekday ?? row.dayOfWeek;
  const start = (row.startHm ?? row.startTime ?? "").trim();
  const end = (row.endHm ?? row.endTime ?? "").trim();
  if (typeof day !== "number" || day < 1 || day > 7 || !start || !end) return null;
  const show = (row.showName ?? row.label ?? "").trim();
  if (!show) return null;
  const djName = row.djName?.trim();
  const dj = MOCK_JOCKS.find((j) => j.name === djName) ?? MOCK_JOCKS[fallbackIndex % MOCK_JOCKS.length]!;
  const id = String(row.id ?? "").trim() || `sch-${fallbackIndex}-${day}-${start}`;
  return {
    id,
    jockId: `jk-${dj.slug}`,
    dayOfWeek: day,
    startTime: start,
    endTime: end,
    label: show,
    notes: row.notes?.trim() ?? "—",
    coHostName: null,
    programImagePath: row.programImagePath ?? null,
    jock: {
      id: dj.slug,
      name: dj.name,
      imagePath: dj.imagePath,
      imageFocusX: dj.imageFocusX,
      imageFocusY: dj.imageFocusY,
    },
  };
}

/** Admin JSON of `programmingSchedule`, of fallback naar demo uit mock. */
export function getPublicProgrammingData(branding: PublicBranding): {
  slots: MockProgrammingSlot[];
  temporarySlots: (MockProgrammingSlot & { startsOn: string; endsOn: string; isActive: boolean })[];
} {
  const raw = branding.programmingSchedule;
  if (!Array.isArray(raw) || raw.length === 0) {
    return getMockProgrammingData();
  }
  const slots: MockProgrammingSlot[] = [];
  raw.forEach((row, i) => {
    if (!row || typeof row !== "object") return;
    const slot = rowToSlot(row as ScheduleRow, i);
    if (slot) slots.push(slot);
  });
  if (slots.length === 0) return getMockProgrammingData();
  return { slots, temporarySlots: [] };
}
