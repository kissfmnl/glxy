"use client";

import { useMemo, useRef, useState } from "react";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK } from "@/lib/mock/site";
import type { MockProgrammingSlot } from "@/lib/mock/site";
import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";

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
    <div className="kiss-public-panel font-sans flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-3xl border border-solid border-[#1e375a]/12 bg-[#f2f8fb] shadow-[0_2px_16px_rgba(30,55,90,0.05)]">
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

      <div className={`${KISS_PANEL_BODY_PAD} flex min-h-0 flex-1 flex-col gap-3 pt-0`}>
        <div className="overflow-x-auto rounded-lg border border-[#1e375a]/18 bg-[#0b1020] p-1 [-webkit-overflow-scrolling:touch]">
          <div className="flex min-w-max gap-0.5 sm:min-w-0 sm:grid sm:grid-cols-7">
            {dayMeta.map((day) => {
              const selected = day.id === selectedDay;
              const isToday = day.id === today;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className={`shrink-0 rounded-md px-2 py-1.5 text-center transition-colors sm:min-h-0 sm:px-1 ${
                    selected
                      ? "bg-[var(--brand-primary)] text-[#0a0f0c] shadow-inner"
                      : isToday
                        ? "bg-white/12 text-white"
                        : "text-white/55 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-pressed={selected}
                  title={day.fullLabel}
                >
                  <span className="block text-[10px] font-black uppercase leading-none tracking-wide">{day.label}</span>
                  <span className="mt-0.5 block text-[9px] font-semibold normal-case leading-none text-current/85">
                    {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(day.date)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch]">
          {daySlots.length === 0 ? (
            <div className="rounded-xl border border-[#d5deea] bg-white/80 py-8 text-center">
              <p className="text-xs font-bold text-gray-600">Geen programmering voor deze dag.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
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
                    className="group relative overflow-hidden rounded-xl border border-[#1e375a]/15 bg-[#0f172a] shadow-md"
                  >
                    <div className="relative aspect-[21/9] min-h-[96px] w-full overflow-hidden sm:min-h-[108px]">
                      {img ? (
                        <AppImage
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          style={
                            slot.programImagePath
                              ? undefined
                              : {
                                  objectPosition: `${(slot.jock.imageFocusX <= 1 ? slot.jock.imageFocusX * 100 : slot.jock.imageFocusX)}% ${
                                    slot.jock.imageFocusY <= 1 ? slot.jock.imageFocusY * 100 : slot.jock.imageFocusY
                                  }%`,
                                }
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#1e375a] p-4">
                          <AppImage src={MOCK_COVER_FALLBACK} alt="" className="h-14 w-auto object-contain opacity-90" loading="lazy" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      {isLive ? (
                        <div className="absolute right-2 top-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                            <span className="inline-flex h-1.5 w-1.5 rounded-full kiss-live-dot" style={{ backgroundColor: "#ef4444" }} />
                            {liveBadgeText}
                          </span>
                        </div>
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8">
                        <p className="line-clamp-2 text-xs font-black uppercase leading-snug tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                          {title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/75">{subLine}</p>
                        <p className="mt-1 font-mono text-[10px] font-black tabular-nums text-[var(--brand-primary)]">
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
    </div>
  );
}
