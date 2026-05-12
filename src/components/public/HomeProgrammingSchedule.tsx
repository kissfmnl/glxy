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
      className="kiss-public-panel font-sans relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-[1.35rem] border border-solid sm:rounded-3xl"
      style={{
        background: `linear-gradient(165deg, color-mix(in srgb, ${theme.panelSurfaceHex} 92%, ${theme.sectionAccentHex}) 0%, ${theme.panelSurfaceHex} 42%, #050810 100%)`,
        borderColor: `${theme.panelBorderHex}80`,
        boxShadow: `0 4px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        aria-hidden
      />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <GlxyHomePanelHeading title={panelTitle} theme={theme} />

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:mb-5">
            <div className="flex min-w-min gap-1 rounded-2xl p-1.5" style={{ backgroundColor: "rgba(0,0,0,0.38)" }}>
              {dayMeta.map((day) => {
                const selected = day.id === selectedDay;
                const isToday = day.id === today;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDay(day.id)}
                    className="relative min-w-[2.75rem] shrink-0 rounded-xl px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 sm:min-w-[3rem] sm:px-3.5 sm:py-2.5 sm:text-xs"
                    aria-pressed={selected}
                    title={day.fullLabel}
                    style={
                      selected
                        ? {
                            background: `linear-gradient(160deg, color-mix(in srgb, ${theme.sectionAccentHex} 50%, #0f172a), ${theme.stationTabSelectedBgHex})`,
                            color: theme.stationTabSelectedTextHex,
                            boxShadow: `0 0 22px color-mix(in srgb, ${theme.sectionAccentHex} 40%, transparent)`,
                          }
                        : {
                            color: isToday ? "rgba(226,232,240,0.85)" : "rgba(148,163,184,0.65)",
                          }
                    }
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
            {daySlots.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.03] px-4 py-10 text-center backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-400">Geen programmering voor deze dag.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-3.5">
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
                      className="group relative flex min-h-[4.5rem] overflow-hidden rounded-2xl transition-all duration-300 sm:min-h-[5rem] sm:rounded-[1.25rem]"
                      style={{
                        background: "linear-gradient(100deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.2) 100%)",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.28)",
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background: `radial-gradient(100% 80% at 0% 50%, color-mix(in srgb, ${theme.sectionAccentHex} 14%, transparent), transparent 60%)`,
                        }}
                      />
                      <div
                        className="relative flex w-[5.25rem] shrink-0 flex-col items-center justify-center px-2 py-3 sm:w-24 sm:px-3"
                        style={{
                          background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 100%)",
                        }}
                      >
                        <span
                          className="font-mono text-lg font-bold tabular-nums leading-none tracking-tight text-white sm:text-xl"
                          style={{ color: theme.sectionAccentHex }}
                        >
                          {slot.startTime}
                        </span>
                        <span className="mt-1.5 font-mono text-[11px] font-medium tabular-nums text-slate-500 sm:text-xs">
                          {slot.endTime}
                        </span>
                      </div>
                      <div className="relative flex min-w-0 flex-1 flex-col justify-center px-3 py-3 pl-4 sm:px-5 sm:py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-[0.95rem] font-bold leading-tight tracking-tight text-white sm:text-lg">
                              {title}
                            </h3>
                            {subtitle ? (
                              <p className="mt-1 line-clamp-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 sm:text-xs">
                                {subtitle}
                              </p>
                            ) : null}
                          </div>
                          {isLive ? (
                            <span
                              className="relative shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-red-100 sm:text-[10px]"
                              style={{
                                background: "linear-gradient(135deg, rgba(239,68,68,0.35), rgba(127,29,29,0.5))",
                                boxShadow: "0 0 20px rgba(239,68,68,0.55), 0 0 40px rgba(239,68,68,0.2)",
                              }}
                            >
                              <span
                                className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full align-middle"
                                style={{ backgroundColor: "#fca5a5", boxShadow: "0 0 8px #ef4444" }}
                              />
                              {liveBadgeText}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
