"use client";

import { useMemo, useRef, useState } from "react";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";
import type { MockProgrammingSlot } from "@/lib/mock/site";
import { mergeJustPlayedConfig, type PublicJustPlayedConfig } from "@/lib/justPlayedConfig";
import { KISS_PANEL_BODY_PAD } from "@/lib/publicPanelChrome";

const DAYS: { id: number; label: string }[] = [
  { id: 1, label: "Ma" },
  { id: 2, label: "Di" },
  { id: 3, label: "Wo" },
  { id: 4, label: "Do" },
  { id: 5, label: "Vr" },
  { id: 6, label: "Za" },
  { id: 7, label: "Zo" },
];

function dayIdFromJs(day: number) {
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

function isNonStopProgram(slot: { label: string | null; jock: { name: string } }) {
  const label = slot.label?.trim().toLowerCase() || "";
  const jock = slot.jock.name.trim().toLowerCase();
  return label === "non-stop" || label === "nonstop" || jock === "non-stop" || jock === "nonstop";
}

export function HomeProgrammingSchedule({
  slots,
  temporarySlots,
  liveBadgeText,
  panelTitle = "SCHEDULE",
  justPlayedUi,
}: {
  slots: MockProgrammingSlot[];
  temporarySlots: (MockProgrammingSlot & { startsOn: string; endsOn: string; isActive: boolean })[];
  liveBadgeText: string;
  panelTitle?: string;
  /** Zelfde kleurpalet als JUST PLAYED-titel (admin /just-played). */
  justPlayedUi?: PublicJustPlayedConfig | null;
}) {
  const schedulePalette = mergeJustPlayedConfig(justPlayedUi ?? null);
  const nowRef = useRef<Date>(new Date());
  const nowDate = nowRef.current;
  const today = dayIdFromJs(nowDate.getDay());
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const [selectedDay, setSelectedDay] = useState<number>(today);

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

  const dayMeta = useMemo(() => {
    const weekStart = startOfIsoWeek(nowDate);
    return DAYS.map((d, idx) => ({
      ...d,
      fullLabel: ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"][idx] ?? d.label,
      date: addDays(weekStart, idx),
      ymd: ymd(addDays(weekStart, idx)),
    }));
  }, [nowDate]);

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
    selectedDay === today
      ? daySlots.find((slot) => {
          const start = timeToMinutes(slot.startTime);
          const end = timeToMinutes(slot.endTime);
          return nowMinutes >= start && nowMinutes < end;
        })?.id ?? null
      : null;

  return (
    <div className="kiss-public-panel font-sans flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-xl border border-solid border-[#1e375a]/12 bg-[#f2f8fb] shadow-[0_2px_12px_rgba(30,55,90,0.05)]">
      <div className="shrink-0 px-4 pb-2 pt-3">
        <div
          className="inline-flex max-w-full select-none rounded-md px-3 py-1.5"
          style={{
            backgroundColor: schedulePalette.scheduleTitleBgHex,
            color: schedulePalette.scheduleTitleTextHex,
          }}
        >
          <span className="text-[11px] font-black uppercase leading-none tracking-[0.2em] antialiased">{panelTitle}</span>
        </div>
      </div>

      <div className={`${KISS_PANEL_BODY_PAD} flex min-h-0 flex-1 flex-col gap-2 pt-0 !pb-4`}>
        <div className="overflow-x-auto rounded-md border border-[#1e375a]/18 bg-[#0b1020] p-1 [-webkit-overflow-scrolling:touch]">
          <div className="flex min-w-max gap-0.5 sm:min-w-0 sm:grid sm:grid-cols-7">
            {dayMeta.map((day) => {
              const selected = day.id === selectedDay;
              const isToday = day.id === today;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className={`shrink-0 rounded-md px-2 py-1 text-center transition-colors sm:min-h-0 sm:px-1 ${
                    selected
                      ? "bg-[var(--brand-primary)] text-[#0a0f0c] shadow-inner"
                      : isToday
                        ? "bg-white/12 text-white"
                        : "text-white/55 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-pressed={selected}
                  title={day.fullLabel}
                >
                  <span className="block text-[9px] font-black uppercase leading-none tracking-wide sm:text-[10px]">{day.label}</span>
                  <span className="mt-0.5 block text-[8px] font-semibold normal-case leading-none text-current/85 sm:text-[9px]">
                    {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(day.date)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch]">
          {daySlots.length === 0 ? (
            <div className="rounded-lg border border-[#d5deea] bg-white/80 py-6 text-center">
              <p className="text-[11px] font-bold text-gray-600">Geen programmering voor deze dag.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {daySlots.map((slot) => {
                const title = slot.label?.trim() || formatShowName(slot.jock.name);
                const hideJock = isNonStopProgram(slot);
                const hostLine = slot.coHostName?.trim()
                  ? `${formatShowName(slot.jock.name)} & ${formatShowName(slot.coHostName)}`
                  : formatShowName(slot.jock.name);
                const subLine = !hideJock ? hostLine : title;
                const isLive = slot.id === nowPlayingId;
                return (
                  <article
                    key={`${slot.source}-${slot.id}`}
                    className="rounded-lg border border-[#1e375a]/12 bg-white/95 px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-[11px] font-black uppercase leading-snug tracking-wide text-gray-900 line-clamp-2 sm:text-xs">
                        {title}
                      </p>
                      {isLive ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] text-red-700">
                          <span className="inline-flex h-1.5 w-1.5 rounded-full kiss-live-dot" style={{ backgroundColor: "#ef4444" }} />
                          {liveBadgeText}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-600 line-clamp-2 sm:text-[10px]">
                      {subLine}
                    </p>
                    <p className="mt-1 font-mono text-[9px] font-black tabular-nums text-[var(--brand-primary)] sm:text-[10px]">
                      {slot.startTime} – {slot.endTime}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
