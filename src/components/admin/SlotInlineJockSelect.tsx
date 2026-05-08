"use client";

type JockOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type SlotData = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
  notes: string | null;
  jockId: string;
};

export function SlotInlineJockSelect({
  slot,
  jocks,
  action,
}: {
  slot: SlotData;
  jocks: JockOption[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={slot.id} />
      <input type="hidden" name="dayOfWeek" value={String(slot.dayOfWeek)} />
      <input type="hidden" name="startTime" value={slot.startTime} />
      <input type="hidden" name="endTime" value={slot.endTime} />
      <input type="hidden" name="label" value={slot.label ?? ""} />
      <input type="hidden" name="notes" value={slot.notes ?? ""} />

      <select
        name="jockId"
        defaultValue={slot.jockId}
        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary transition-all"
        onChange={(e) => {
          e.currentTarget.form?.requestSubmit();
        }}
        aria-label="Kies DJ"
        title="Kies DJ"
      >
        {jocks.map((j) => (
          <option key={j.id} value={j.id}>
            {j.name}
            {j.isActive ? "" : " (inactief)"}
          </option>
        ))}
      </select>
    </form>
  );
}

