"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK } from "@/lib/mock/site";
import type { MockProgrammingSlot } from "@/lib/mock/site";
import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";

const DAYS: { id: number; label: string }[] = [
  { id: 1, label: "Maandag" },
  { id: 2, label: "Dinsdag" },
  { id: 3, label: "Woensdag" },
  { id: 4, label: "Donderdag" },
  { id: 5, label: "Vrijdag" },
  { id: 6, label: "Zaterdag" },
  { id: 7, label: "Zondag" },
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

function assetSrc(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return imagePath;
}

export function HomeProgrammingSchedule({
  slots,
  temporarySlots,
  liveBadgeText,
  panelTitle = "Programmering",
  scheduleCta = "Volledige programmering",
  scheduleHref = "/programmering",
}: {
  slots: MockProgrammingSlot[];
  temporarySlots: (MockProgrammingSlot & { startsOn: string; endsOn: string; isActive: boolean })[];
  liveBadgeText: string;
  panelTitle?: string;
  scheduleCta?: string;
  scheduleHref?: string;
}) {
  const nowRef = useRef<Date>(new Date());
  const nowDate = nowRef.current;
  const today = dayIdFromJs(nowDate.getDay());
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const [weekOffset, setWeekOffset] = useState(0);
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
    const weekStart = addDays(startOfIsoWeek(nowDate), weekOffset * 7);
    return DAYS.map((d, idx) => ({ ...d, date: addDays(weekStart, idx), ymd: ymd(addDays(weekStart, idx)) }));
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

  useEffect(() => {
    if (weekOffset === 0) setSelectedDay(today);
    else setSelectedDay(1);
  }, [weekOffset, today]);

  return (
    <div className="kiss-public-panel flex min-w-0 w-full flex-col overflow-hidden rounded-3xl border border-solid border-[#1e375a]/12 bg-[#f2f8fb] shadow-[0_2px_16px_rgba(30,55,90,0.05)]">
      <div className={`flex shrink-0 items-center justify-between gap-3 ${KISS_PANEL_HEADER_BOX}`}>
        <p className={`${KISS_PANEL_TITLE} min-w-0`}>{panelTitle}</p>
        <a
          href={scheduleHref}
          className="text-brand-primary inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-black hover:underline"
        >
          {scheduleCta}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </a>
      </div>

      <div className={`${KISS_PANEL_BODY_PAD} flex flex-col gap-4 pt-0`}>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            disabled={weekOffset === 0}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#9fb1c7] bg-white text-[#1f3f62] disabled:opacity-40"
            aria-label="Vorige week"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="inline-flex h-9 min-w-[140px] items-center justify-center rounded-full border border-[#1e375a]/20 bg-[#1e375a] px-4 text-center text-[11px] font-black uppercase tracking-wide text-white">
            {weekOffset === 0 ? "Deze week" : "Volgende week"}
          </div>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => Math.min(1, w + 1))}
            disabled={weekOffset === 1}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#9fb1c7] bg-white text-[#1f3f62] disabled:opacity-40"
            aria-label="Volgende week"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e375a]/18 bg-[#0b1020] p-1.5 shadow-inner [-webkit-overflow-scrolling:touch]">
          <div className="flex min-w-max gap-1 sm:min-w-0 sm:grid sm:grid-cols-7 sm:gap-0">
            {DAYS.map((day, idx) => {
              const selected = day.id === selectedDay;
              const isToday = weekOffset === 0 && day.id === today;
              const meta = dayMeta[idx];
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className={`shrink-0 rounded-lg px-3 py-2.5 text-center text-[10px] font-black uppercase leading-tight tracking-wide transition-colors sm:min-h-[52px] sm:px-1 ${
                    selected
                      ? "bg-[var(--brand-primary)] text-[#0a0f0c] shadow-[0_2px_12px_rgba(11,117,87,0.45)]"
                      : isToday
                        ? "bg-white/10 text-white hover:bg-white/15"
                        : "text-white/55 hover:bg-white/8 hover:text-white/90"
                  }`}
                  aria-pressed={selected}
                >
                  <span className="block">{day.label}</span>
                  {meta ? (
                    <span className="mt-0.5 block text-[9px] font-bold normal-case tracking-normal text-current/80">
                      {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(meta.date)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {daySlots.length === 0 ? (
          <div className="rounded-2xl border border-[#d5deea] bg-white/80 py-10 text-center">
            <p className="text-sm font-bold text-gray-600">Geen programmering voor deze dag.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {daySlots.map((slot) => {
              const img = assetSrc(slot.programImagePath || slot.jock.imagePath);
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
                  className="group relative overflow-hidden rounded-2xl border border-[#1e375a]/15 bg-[#0f172a] shadow-[0_12px_36px_rgba(6,12,24,0.35)]"
                >
                  <div className="relative aspect-[5/3] w-full overflow-hidden sm:aspect-[16/10]">
                    {img ? (
                      <AppImage
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        style={slot.programImagePath ? undefined : { objectPosition: `${slot.jock.imageFocusX}% ${slot.jock.imageFocusY}%` }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1e375a] p-6">
                        <AppImage src={MOCK_COVER_FALLBACK} alt="" className="h-24 w-auto object-contain opacity-90" loading="lazy" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                    {isLive ? (
                      <div className="absolute right-2 top-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                          <span className="inline-flex h-1.5 w-1.5 rounded-full kiss-live-dot" style={{ backgroundColor: "#ef4444" }} />
                          {liveBadgeText}
                        </span>
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 p-3 pt-10">
                      <p className="line-clamp-2 text-sm font-black uppercase leading-snug tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                        {title}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">{subLine}</p>
                      <p className="mt-2 font-mono text-[11px] font-black tabular-nums text-[var(--brand-primary)]">
                        {slot.startTime} – {slot.endTime}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
