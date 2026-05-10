"use client";

import { useMemo, useRef, useState } from "react";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";
import type { MockProgrammingSlot } from "@/lib/mock/site";
import { mergeJustPlayedConfig, type PublicJustPlayedConfig } from "@/lib/justPlayedConfig";
import { KISS_PANEL_BODY_PAD } from "@/lib/publicPanelChrome";
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

  const dayBarBg = theme.stationTabInactiveBgHex;
  const dayBarBorder = theme.stationTabInactiveBorderHex;

  return (
    <div
      className="kiss-public-panel font-sans flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
      style={{
        backgroundColor: theme.panelSurfaceHex,
        borderColor: theme.panelBorderHex,
      }}
    >
      <GlxyHomePanelHeading title={panelTitle} theme={theme} />

      <div className={`${KISS_PANEL_BODY_PAD} flex min-h-0 flex-1 flex-col gap-2 pt-0 !px-3 !pb-3 sm:!px-4 sm:!pb-3.5`}>
        <div
          className="overflow-x-auto rounded-lg border p-0.5 [-webkit-overflow-scrolling:touch]"
          style={{ backgroundColor: dayBarBg, borderColor: dayBarBorder }}
        >
          <div className="flex min-w-max gap-0.5 sm:min-w-0 sm:grid sm:grid-cols-7">
            {dayMeta.map((day) => {
              const selected = day.id === selectedDay;
              const isToday = day.id === today;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className="min-h-[28px] shrink-0 rounded-md px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors sm:min-h-0 sm:px-1 sm:text-[10px]"
                  aria-pressed={selected}
                  title={day.fullLabel}
                  style={
                    selected
                      ? {
                          backgroundColor: theme.stationTabSelectedBgHex,
                          color: theme.stationTabSelectedTextHex,
                          boxShadow: `inset 0 -2px 0 0 ${theme.sectionAccentHex}`,
                        }
                      : {
                          backgroundColor: "transparent",
                          color: isToday ? "#cbd5e1" : "#64748b",
                        }
                  }
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch]">
          {daySlots.length === 0 ? (
            <div
              className="rounded-lg border border-white/[0.06] py-8 text-center"
              style={{ backgroundColor: `${theme.panelSurfaceHex}` }}
            >
              <p className="text-[11px] font-medium text-white/55">Geen programmering voor deze dag.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {daySlots.map((slot) => {
                const title = slot.label?.trim() || formatShowName(slot.jock.name);
                const isLive = slot.id === nowPlayingId;
                return (
                  <article
                    key={`${slot.source}-${slot.id}`}
                    className="flex items-center gap-2 rounded border border-white/10 bg-black/15 px-2 py-0.5 sm:gap-2.5 sm:px-2.5 sm:py-1"
                  >
                    <span
                      className="shrink-0 whitespace-nowrap font-mono text-[9px] font-medium tabular-nums tracking-tight text-white/95 sm:text-[10px]"
                      style={{ color: theme.sectionAccentHex }}
                    >
                      {slot.startTime}\u2009–\u2009{slot.endTime}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 border-l border-white/15 pl-2 sm:pl-2.5">
                      <p className="min-w-0 truncate text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-white sm:text-[11px]">
                        {title}
                      </p>
                      {isLive ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded border border-red-400/40 bg-red-500/15 px-1.5 py-px text-[7px] font-semibold uppercase tracking-wide text-red-100">
                          <span
                            className="inline-flex h-1 w-1 rounded-full kiss-live-dot"
                            style={{ backgroundColor: "#ef4444" }}
                          />
                          {liveBadgeText}
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
