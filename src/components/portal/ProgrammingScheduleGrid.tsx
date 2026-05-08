import Link from "next/link";
import type { ReactNode } from "react";

type GridSlot = {
  id: string;
  slotId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  jockName: string;
  coHostName?: string | null;
  programColor?: string | null;
  isTemporary?: boolean;
  source?: "base" | "temp";
};

const days: { id: number; short: string; label: string }[] = [
  { id: 1, short: "Ma", label: "Maandag" },
  { id: 2, short: "Di", label: "Dinsdag" },
  { id: 3, short: "Wo", label: "Woensdag" },
  { id: 4, short: "Do", label: "Donderdag" },
  { id: 5, short: "Vr", label: "Vrijdag" },
  { id: 6, short: "Za", label: "Zaterdag" },
  { id: 7, short: "Zo", label: "Zondag" },
];

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function pad2(v: number) {
  return String(v).padStart(2, "0");
}

function colorFromProgram(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return {
    bg: `hsl(${hue} 85% 90%)`,
    border: `hsl(${hue} 60% 55%)`,
    text: `hsl(${hue} 45% 24%)`,
  };
}

export function ProgrammingScheduleGrid({
  title,
  subtitle,
  slots,
  basePath,
  weekYmd,
  mode,
  dayDates,
  headerActions,
}: {
  title: string;
  subtitle: string;
  slots: GridSlot[];
  basePath: string;
  weekYmd: string;
  mode: "fixed" | "week";
  dayDates?: Record<number, string>;
  headerActions?: ReactNode;
}) {
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-[#b9c9dd] bg-[#f7fbff] p-4">
        <h2 className="text-sm font-black text-[#1e375a]">{title}</h2>
        <p className="mt-1 text-[11px] font-bold text-[#365579]">{subtitle}</p>
        <p className="mt-3 text-xs font-bold text-gray-500">Nog geen slots.</p>
      </div>
    );
  }

  const startHour = 7;
  const endHour = 24;
  const hourCount = Math.max(1, endHour - startHour);
  const pxPerMinute = 1;
  const gridHeight = hourCount * 60 * pxPerMinute;
  function buildEditHref(input: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotId?: string;
    source?: "base" | "temp";
  }) {
    const qs = new URLSearchParams();
    qs.set("tab", "week");
    qs.set("week", weekYmd);
    qs.set("editMode", mode);
    qs.set("editDay", String(input.dayOfWeek));
    qs.set("editStart", input.startTime);
    qs.set("editEnd", input.endTime);
    if (mode === "week" && dayDates?.[input.dayOfWeek]) {
      qs.set("editDate", dayDates[input.dayOfWeek]);
    }
    if (input.slotId) qs.set("editSlotId", input.slotId);
    if (input.source) qs.set("editSource", input.source);
    return `${basePath}?${qs.toString()}#quick-editor`;
  }

  return (
    <div className="rounded-2xl border border-[#b9c9dd] bg-[#f7fbff] p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#1e375a]">{title}</h2>
          <p className="mt-1 text-[11px] font-bold text-[#365579]">{subtitle}</p>
        </div>
        {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
      </div>

      <div className="mt-2 overflow-hidden rounded-lg border border-[#d6e2ef] bg-white">
        <div className="grid min-w-[980px] grid-cols-[84px_repeat(7,minmax(0,1fr))] border-b border-[#d6e2ef] bg-[#dcecff]">
          <div className="px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#102a43]">Uur</div>
          {days.map((d) => (
            <div key={`head-${d.id}`} className="border-l border-[#c5daef] px-2 py-2 text-[#102a43]">
              <p className="text-[11px] font-black uppercase tracking-[0.14em]">{d.label}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#20476f]">
                {dayDates?.[d.id] ?? ""}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
          <div className="grid grid-cols-[84px_repeat(7,minmax(0,1fr))]">
            <div className="relative border-r border-[#d6e2ef]" style={{ height: `${gridHeight}px` }}>
              {Array.from({ length: hourCount + 1 }, (_, i) => {
                const minuteOffset = i * 60;
                const labelHour = startHour + i;
                return (
                  <div key={`time-${labelHour}`} className="absolute left-0 right-0" style={{ top: `${minuteOffset * pxPerMinute}px` }}>
                    <div
                      className={`px-2 text-[10px] font-black text-[#1e375a] ${i === 0 ? "pt-2" : "-translate-y-1/2"}`}
                    >
                      {pad2(labelHour)}:00
                    </div>
                  </div>
                );
              })}
            </div>

            {days.map((d) => {
              const daySlots = slots.filter((s) => s.dayOfWeek === d.id);
              return (
                <div key={`day-${d.id}`} className="relative border-l border-[#eef3f8]" style={{ height: `${gridHeight}px` }}>
                  {Array.from({ length: hourCount + 1 }, (_, i) => (
                    <div
                      key={`line-${d.id}-${i}`}
                      className="absolute left-0 right-0 border-t border-[#e4edf7]"
                      style={{ top: `${i * 60 * pxPerMinute}px` }}
                    />
                  ))}
                  {Array.from({ length: hourCount }, (_, i) => {
                    const hour = startHour + i;
                    const startTime = `${pad2(hour)}:00`;
                    const endTime = `${pad2(Math.min(23, hour + 1))}:${hour + 1 >= 24 ? "59" : "00"}`;
                    return (
                      <Link
                        key={`click-${d.id}-${hour}`}
                        href={buildEditHref({ dayOfWeek: d.id, startTime, endTime })}
                        className="absolute left-0 right-0 block cursor-pointer border-b border-transparent hover:bg-[#dff3ff]/50"
                        style={{ top: `${i * 60 * pxPerMinute}px`, height: `${60 * pxPerMinute}px` }}
                        title={`Programma bewerken/toevoegen ${d.label} ${startTime}`}
                      />
                    );
                  })}

                  {daySlots.map((s) => {
                    const start = toMinutes(s.startTime) - startHour * 60;
                    const end = toMinutes(s.endTime) - startHour * 60;
                    const duration = Math.max(30, end - start);
                    const top = start * pxPerMinute;
                    const height = Math.max(30, duration * pxPerMinute - 2);
                    const programColor = s.programColor
                      ? { bg: `${s.programColor}22`, border: s.programColor, text: "#14385d" }
                      : colorFromProgram(s.title);
                    return (
                      <Link
                        key={`slot-${d.id}-${s.id}`}
                        href={buildEditHref({
                          dayOfWeek: d.id,
                          startTime: s.startTime,
                          endTime: s.endTime,
                          slotId: s.slotId,
                          source: s.source,
                        })}
                        className={`absolute left-1 right-1 z-10 cursor-pointer overflow-hidden rounded-md border px-1.5 py-1 transition-all hover:brightness-95 ${
                          s.isTemporary ? "ring-1 ring-amber-500/60" : ""
                        }`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: programColor.bg,
                          borderColor: programColor.border,
                          color: programColor.text,
                        }}
                      >
                        <p className="truncate text-[10px] font-black">{s.title}</p>
                        <p className="truncate text-[9px] font-bold">
                          {s.jockName}
                          {s.coHostName ? ` + ${s.coHostName}` : ""}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
