"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";

type Slot = {
  id: string;
  jockId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
  notes: string | null;
  coHostName: string | null;
  programImagePath?: string | null;
  jock: {
    id: string;
    name: string;
    imagePath: string | null;
    imageFocusX: number;
    imageFocusY: number;
  };
};

type TemporarySlot = Slot & {
  startsOn: string | Date;
  endsOn: string | Date;
  isActive: boolean;
};

const days: { id: number; label: string; short: string }[] = [
  { id: 1, label: "Maandag", short: "Ma" },
  { id: 2, label: "Dinsdag", short: "Di" },
  { id: 3, label: "Woensdag", short: "Wo" },
  { id: 4, label: "Donderdag", short: "Do" },
  { id: 5, label: "Vrijdag", short: "Vr" },
  { id: 6, label: "Zaterdag", short: "Za" },
  { id: 7, label: "Zondag", short: "Zo" },
];

function dayIdFromJsDate(day: number) {
  return day === 0 ? 7 : day;
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function formatShowName(value: string) {
  const v = value.trim().toLowerCase();
  if (v === "non-stop" || v === "nonstop" || v === "kiss non-stop" || v === "kiss nonstop") return "GLXY Non-stop";
  return value;
}

function isNonStopProgram(slot: Slot) {
  const label = slot.label?.trim().toLowerCase() || "";
  const jock = slot.jock.name.trim().toLowerCase();
  return label === "non-stop" || label === "nonstop" || jock === "non-stop" || jock === "nonstop";
}

export function ProgrammingAgenda({
  slots,
  temporarySlots,
  liveBadgeText,
}: {
  slots: Slot[];
  temporarySlots: TemporarySlot[];
  liveBadgeText: string;
}) {
  const nowRef = useRef<Date>(new Date());
  const nowDate = nowRef.current;
  const today = dayIdFromJsDate(nowDate.getDay());
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(today);
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  function startOfIsoWeek(d: Date) {
    const x = new Date(d);
    const js = x.getDay() || 7;
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - (js - 1));
    return x;
  }
  function addDays(d: Date, daysToAdd: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + daysToAdd);
    return x;
  }
  function ymd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function dateLabel(d: Date) {
    return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(d);
  }
  const dayMeta = useMemo(() => {
    const weekStart = addDays(startOfIsoWeek(nowDate), weekOffset * 7);
    return days.map((d, idx) => ({ ...d, date: addDays(weekStart, idx), ymd: ymd(addDays(weekStart, idx)) }));
  }, [weekOffset, nowDate]);

  const daySlots = useMemo(() => {
    const temp = temporarySlots.map((t) => ({
      ...t,
      startsOn: new Date(t.startsOn),
      endsOn: new Date(t.endsOn),
    }));
    const selectedMeta = dayMeta.find((d) => d.id === selectedDay);
    const dayYmd = selectedMeta?.ymd ?? formatAmsterdamYMD();
    return mergeScheduleSlotsForDay(slots, temp, dayYmd, selectedDay);
  }, [slots, temporarySlots, selectedDay, dayMeta]);

  const nowPlayingId =
    weekOffset === 0 && selectedDay === today
      ? daySlots.find((slot) => {
          const start = timeToMinutes(slot.startTime);
          const end = timeToMinutes(slot.endTime);
          return nowMinutes >= start && nowMinutes < end;
        })?.id ?? null
      : null;

  const selectedIndex = Math.max(0, days.findIndex((d) => d.id === selectedDay));

  useEffect(() => {
    if (weekOffset === 0) {
      setSelectedDay(today);
      return;
    }
    setSelectedDay(1);
  }, [weekOffset, today]);

  return (
    <div className="w-full rounded-2xl border border-[#d3dae4] bg-[#eef2f6] p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-center">
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            disabled={weekOffset === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#9fb1c7] bg-white text-[#1f3f62] disabled:opacity-40"
            aria-label="Vorige week"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="inline-flex h-10 min-w-[156px] items-center justify-center rounded-full border border-[#1e375a]/20 bg-[#1e375a] px-5 text-center text-xs font-black text-white">
            {weekOffset === 0 ? "Deze week" : "Volgende week"}
          </div>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => Math.min(1, w + 1))}
            disabled={weekOffset === 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#9fb1c7] bg-white text-[#1f3f62] disabled:opacity-40"
            aria-label="Volgende week"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[#c7d3e2] bg-white p-1.5">
        <div
          className="absolute bottom-1.5 top-1.5 rounded-full border border-[#1e375a]/20 bg-[#d9e9fb] transition-transform duration-300 ease-out"
          style={{
            width: "calc((100% - 12px) / 7)",
            transform: `translateX(calc(${selectedIndex} * 100%))`,
          }}
          aria-hidden
        />

        <div className="relative z-10 grid grid-cols-7">
          {dayMeta.map((day) => {
            const selected = day.id === selectedDay;
            const isToday = weekOffset === 0 && day.id === today;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDay(day.id)}
                className={`flex min-h-[46px] flex-col items-center justify-center px-1 py-2 text-center text-[11px] font-black leading-tight transition-colors sm:min-h-[54px] sm:text-xs ${
                  selected ? "text-[#112a43]" : isToday ? "text-[#1e375a]" : "text-[#4a5d74] hover:text-[#1e375a]"
                }`}
                aria-pressed={selected}
              >
                <span className="sm:hidden">{day.short}</span>
                <span className="hidden sm:inline">{day.label}</span>
                <span className="text-[10px] font-bold tracking-normal normal-case">{dateLabel(day.date)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {daySlots.length === 0 ? (
        <div className="mt-5 rounded-xl border border-[#d5deea] bg-[#f2f5fa] p-6 text-center">
          <p className="text-sm font-bold text-gray-600">Geen programmering voor deze dag.</p>
        </div>
      ) : (
        <div className="mt-5 grid w-full gap-2 sm:gap-2.5">
          {daySlots.map((slot) => {
            const title = slot.label?.trim() || formatShowName(slot.jock.name);
            const hideJock = isNonStopProgram(slot);
            const hostLine = slot.coHostName?.trim()
              ? `${formatShowName(slot.jock.name)} & ${formatShowName(slot.coHostName)}`
              : formatShowName(slot.jock.name);
            const subLine = !hideJock ? hostLine : title;
            const isNow = slot.id === nowPlayingId;
            const note = slot.notes?.trim();

            return (
              <article
                key={`${slot.source}-${slot.id}`}
                className="w-full rounded-xl border border-[#c5d2e2] bg-white px-4 py-3 shadow-sm md:px-5 md:py-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[11px] font-black tabular-nums text-[var(--brand-primary)] sm:text-xs">
                    {slot.startTime} – {slot.endTime}
                  </p>
                  {isNow ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#1e375a]/35 bg-[#1e375a] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full kiss-live-dot" style={{ backgroundColor: "#fca5a5" }} />
                      {liveBadgeText}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-1 text-base font-black uppercase leading-snug tracking-wide text-gray-900 md:text-lg">
                  {title}
                </h2>
                {!hideJock ? (
                  <p className="mt-0.5 text-sm font-semibold uppercase tracking-wide text-gray-600">{subLine}</p>
                ) : null}
                {note ? <p className="mt-2 text-xs leading-relaxed text-gray-600">{note}</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
