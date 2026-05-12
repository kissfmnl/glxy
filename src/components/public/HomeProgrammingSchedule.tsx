"use client";

import { useMemo, useRef, useState } from "react";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";
import type { MockProgrammingSlot } from "@/lib/mock/site";
import { mergeJustPlayedConfig, type PublicJustPlayedConfig } from "@/lib/justPlayedConfig";
import { GlxyHomePanelHeading } from "@/components/public/GlxyHomePanelHeading";

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
  justPlayedUi?: PublicJustPlayedConfig | null;
}) {
  const theme = mergeJustPlayedConfig(justPlayedUi ?? null);
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
    <div
      className="kiss-public-panel font-sans flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-xl border sm:rounded-2xl"
      style={{
        background: `linear-gradient(180deg, #0a101c 0%, ${theme.panelSurfaceHex} 45%, #05070d 100%)`,
        borderColor: theme.panelBorderHex,
        boxShadow: "0 18px 50px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <GlxyHomePanelHeading title={panelTitle.toUpperCase()} theme={theme} />

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-0 sm:px-3.5 sm:pb-3.5">
        <div className="mb-2 flex gap-1 overflow-x-auto border-b pb-2 [-webkit-overflow-scrolling:touch] sm:mb-2.5" style={{ borderColor: theme.panelBorderHex }}>
          <div className="flex min-w-min gap-1">
            {dayMeta.map((day) => {
              const selected = day.id === selectedDay;
              const isToday = day.id === today;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className="min-w-[2.25rem] shrink-0 rounded-md px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] transition-colors sm:min-w-[2.5rem] sm:px-2.5 sm:py-1.5 sm:text-[11px]"
                  aria-pressed={selected}
                  title={day.fullLabel}
                  style={
                    selected
                      ? {
                          backgroundColor: theme.stationTabSelectedBgHex,
                          color: "#ffffff",
                          boxShadow: `inset 0 -2px 0 0 ${theme.sectionAccentHex}`,
                        }
                      : {
                          backgroundColor: isToday ? "rgba(255,255,255,0.06)" : "transparent",
                          color: isToday ? "#e2e8f0" : "#64748b",
                        }
                  }
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
          {daySlots.length === 0 ? (
            <p className="py-5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Geen programmering voor deze dag.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {daySlots.map((slot) => {
                const title = slot.label?.trim() || formatShowName(slot.jock.name);
                const hostLine = slot.coHostName?.trim()
                  ? `${formatShowName(slot.jock.name)} & ${formatShowName(slot.coHostName)}`
                  : formatShowName(slot.jock.name);
                const hideJock = isNonStopProgram(slot);
                const subtitleRaw = hideJock ? null : hostLine;
                const subtitle =
                  subtitleRaw && subtitleRaw.trim().toLowerCase() !== title.trim().toLowerCase() ? subtitleRaw : null;
                const isLive = slot.id === nowPlayingId;
                return (
                  <article
                    key={`${slot.source}-${slot.id}`}
                    className="group flex overflow-hidden rounded-lg border border-[#1e293b] bg-[#101822] transition-all duration-200 hover:-translate-y-px hover:border-white/[0.12] hover:shadow-[0_10px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(11,117,87,0.2)]"
                  >
                    <div
                      className="flex w-[4.25rem] shrink-0 flex-col justify-center px-2 py-2.5 sm:w-[4.75rem] sm:py-3"
                      style={{
                        backgroundColor: "#0c121c",
                        borderRight: `1px solid ${theme.panelBorderHex}`,
                        borderLeft: `3px solid ${theme.sectionAccentHex}`,
                      }}
                    >
                      <span
                        className="font-mono text-[13px] font-bold tabular-nums leading-none text-white sm:text-sm"
                        style={{ color: "#f8fafc" }}
                      >
                        {slot.startTime}
                      </span>
                      <span className="mt-1 font-mono text-[10px] font-semibold tabular-nums text-slate-400 sm:text-[11px]">
                        {slot.endTime}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5">
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-[12px] font-bold uppercase leading-tight tracking-wide text-white sm:text-[13px]">
                          {title}
                        </h3>
                        {subtitle ? (
                          <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">
                            {subtitle}
                          </p>
                        ) : null}
                      </div>
                      {isLive ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-[0_0_12px_rgba(220,38,38,0.65)] sm:text-[9px]">
                          <span className="h-1 w-1 rounded-full bg-white kiss-live-dot" aria-hidden />
                          {liveBadgeText.toUpperCase()}
                        </span>
                      ) : null}
                    </div>
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
