import { MOCK_SCHEDULE } from "@/lib/mock/site";

export type ProgrammingEditorRow = {
  id: string;
  weekday: number;
  startHm: string;
  endHm: string;
  showName: string;
  djName: string;
};

function normalizeHm(s: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return "09:00";
  const h = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Admin-editor rijen uit DB-JSON of demo-schema. */
export function editorRowsFromBrandingJson(raw: unknown): ProgrammingEditorRow[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return MOCK_SCHEDULE.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      startHm: normalizeHm(s.startHm),
      endHm: normalizeHm(s.endHm),
      showName: s.showName,
      djName: (s.djName ?? "").trim(),
    }));
  }
  return raw.map((row, i) => {
    const r = row as Record<string, unknown>;
    const day = Number(r.weekday ?? r.dayOfWeek ?? 1);
    return {
      id: String(r.id ?? "").trim() || `sch-${i}`,
      weekday: day >= 1 && day <= 7 ? day : 1,
      startHm: normalizeHm(String(r.startHm ?? r.startTime ?? "09:00")),
      endHm: normalizeHm(String(r.endHm ?? r.endTime ?? "12:00")),
      showName: String(r.showName ?? r.label ?? "").trim(),
      djName: String(r.djName ?? "").trim(),
    };
  });
}

/** Payload zoals `publicProgramming.rowToSlot` verwacht. */
export function editorRowsToSchedulePayload(rows: ProgrammingEditorRow[]): object[] {
  return rows
    .filter((r) => r.showName.trim())
    .map((r) => ({
      id: r.id,
      weekday: r.weekday,
      startHm: r.startHm,
      endHm: r.endHm,
      showName: r.showName.trim(),
      ...(r.djName.trim() ? { djName: r.djName.trim() } : {}),
    }));
}
