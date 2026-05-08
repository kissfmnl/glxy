/** Normaliseert tekstvelden op programmeringsslots voor stabiele vergelijking. */
export function normScheduleField(s: string | null | undefined): string {
  return (s ?? "").trim();
}

export type SchedulePresentationFields = {
  jockId: string;
  coHostName?: string | null;
  label?: string | null;
  notes?: string | null;
  programImagePath?: string | null;
};

export function scheduleSlotPresentationEqual(a: SchedulePresentationFields, b: SchedulePresentationFields): boolean {
  return (
    a.jockId === b.jockId &&
    normScheduleField(a.coHostName) === normScheduleField(b.coHostName) &&
    normScheduleField(a.label) === normScheduleField(b.label) &&
    normScheduleField(a.notes) === normScheduleField(b.notes) &&
    normScheduleField(a.programImagePath) === normScheduleField(b.programImagePath)
  );
}

/**
 * Tijdelijk slot is inhoudelijk gelijk aan het vaste slot op dezelfde dag +zelfde tijden:
 * dan hoeft er geen “tijdelijk” meer getoond te worden (en single-day DB-regels worden opgeschoond).
 */
export function temporarySlotIsRedundantWithBaseSchedule<
  TBase extends SchedulePresentationFields & { dayOfWeek: number; startTime: string; endTime: string },
  TTemp extends SchedulePresentationFields & { dayOfWeek: number; startTime: string; endTime: string },
>(temp: TTemp, baseSlots: TBase[]): boolean {
  const base = baseSlots.find(
    (b) => b.dayOfWeek === temp.dayOfWeek && b.startTime === temp.startTime && b.endTime === temp.endTime
  );
  if (!base) return false;
  return scheduleSlotPresentationEqual(temp, base);
}

export function temporarySlotDivergesFromBaseSchedule<
  TBase extends SchedulePresentationFields & { dayOfWeek: number; startTime: string; endTime: string },
  TTemp extends SchedulePresentationFields & { dayOfWeek: number; startTime: string; endTime: string },
>(temp: TTemp, baseSlots: TBase[]): boolean {
  return !temporarySlotIsRedundantWithBaseSchedule(temp, baseSlots);
}
