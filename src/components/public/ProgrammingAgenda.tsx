"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK } from "@/lib/mock/site";

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

function assetSrc(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return imagePath;
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
  const [isDesktop, setIsDesktop] = useState(false);
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

  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const selectedIndex = Math.max(
    0,
    days.findIndex((d) => d.id === selectedDay)
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (weekOffset === 0) {
      setSelectedDay(today);
      return;
    }
    setSelectedDay(1);
  }, [weekOffset, today]);

  useEffect(() => {
    if (!isDesktop) return;
    // Niet telkens resetten: alleen fallback kiezen als huidige selectie ontbreekt.
    const exists = activeSlotId ? daySlots.some((s) => s.id === activeSlotId) : false;
    if (exists) return;
    setActiveSlotId(nowPlayingId ?? daySlots[0]?.id ?? null);
  }, [selectedDay, weekOffset, nowPlayingId, daySlots, isDesktop, activeSlotId]);

  useEffect(() => {
    if (isDesktop) return;
    // Op mobiel alleen resetten bij dag/week wissel, niet bij klikken op een programma.
    setActiveSlotId(null);
  }, [isDesktop, selectedDay, weekOffset]);

  const featuredSlot = daySlots.find((slot) => slot.id === activeSlotId) ?? daySlots[0] ?? null;
  const featuredIsLive = Boolean(featuredSlot && featuredSlot.id === nowPlayingId);

  return (
    <div className="mt-8 rounded-3xl border border-[#d3dae4] bg-[#eef2f6] p-4 md:p-6 shadow-sm">
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

      <div className="rounded-full border border-[#c7d3e2] bg-white p-1.5 relative overflow-hidden">
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full border border-[#1e375a]/20 bg-[#d9e9fb] transition-transform duration-300 ease-out"
          style={{
            width: "calc((100% - 12px) / 7)",
            transform: `translateX(calc(${selectedIndex} * 100%))`,
          }}
          aria-hidden
        />

        <div className="grid grid-cols-7 relative z-10">
          {dayMeta.map((day) => {
            const selected = day.id === selectedDay;
            const isToday = weekOffset === 0 && day.id === today;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDay(day.id)}
                className={`px-1 py-2 min-h-[46px] sm:min-h-[54px] flex flex-col items-center justify-center text-center font-black text-[11px] sm:text-xs leading-tight transition-colors ${
                  selected
                    ? "text-[#112a43]"
                    : isToday
                      ? "text-[#1e375a]"
                      : "text-[#4a5d74] hover:text-[#1e375a]"
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
        <div className="mt-5 pt-5 border-t border-[#cfdeeb] rounded-b-2xl">
          <div className="rounded-2xl border border-[#d5deea] bg-[#f2f5fa] p-5">
            <p className="text-sm font-bold text-gray-600">Geen programmering voor deze dag.</p>
          </div>
        </div>
      ) : (
        <div key={`${weekOffset}-${selectedDay}`} className="mt-5 pt-5 border-t border-[#cfdeeb] grid gap-4 lg:grid-cols-[1.2fr_1fr] items-start kiss-schedule-swap">
          <div className="grid gap-3">
            {daySlots.map((slot) => {
              const jockImage = assetSrc(slot.programImagePath || slot.jock.imagePath);
              const jockImagePosition = `${slot.jock.imageFocusX}% ${slot.jock.imageFocusY}%`;
              const title = slot.label?.trim() || formatShowName(slot.jock.name);
              const hideJock = isNonStopProgram(slot);
              const hostLine = slot.coHostName?.trim()
                ? `${formatShowName(slot.jock.name)} & ${formatShowName(slot.coHostName)}`
                : formatShowName(slot.jock.name);
              const isNow = slot.id === nowPlayingId;
              const isActive = slot.id === activeSlotId;
              return (
                <div
                  key={`${slot.source}-${slot.id}`}
                  className={`rounded-2xl overflow-hidden ${
                    isActive ? "border border-[#5b82ad] bg-[#eef4fb]" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSlotId(slot.id)}
                    className={`w-full text-left p-4 md:p-5 flex items-center gap-4 transition-colors ${
                      isActive
                        ? "rounded-none border-0 bg-[#eaf2fb]"
                        : "rounded-2xl border border-[#c5d2e2] bg-white hover:border-[#8ba7c7] hover:bg-[#f3f8fb]"
                    }`}
                  >
                    <div className="w-[68px] h-[68px] md:w-[86px] md:h-[86px] rounded-2xl overflow-hidden bg-black/5 border border-black/10 shrink-0">
                      {jockImage ? (
                        <AppImage
                          src={jockImage}
                          alt={slot.jock.name}
                          className="w-full h-full object-cover"
                          style={slot.programImagePath ? undefined : { objectPosition: jockImagePosition }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2" style={{ backgroundColor: "#1e375a" }}>
                          <AppImage src={MOCK_COVER_FALLBACK} alt="GLXY Radio" className="h-full w-full object-contain" loading="lazy" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          {slot.startTime} - {slot.endTime}
                        </p>
                        {isNow ? (
                          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.18em] rounded-full px-2.5 py-1 border border-[#1e375a]/40 bg-[#1e375a] text-white">
                            {liveBadgeText}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-lg font-black text-gray-900 truncate">{title}</p>
                      {!hideJock ? (
                        <p className="text-sm font-bold text-gray-600 truncate">{hostLine}</p>
                      ) : null}
                    </div>
                  </button>
                  {isActive ? (
                    <div className="lg:hidden border-t border-[#95dede] bg-[#f6fbff] px-4 pt-3 pb-3 kiss-program-info-in">
                      <div className="ml-2 pl-3 border-l-2 border-[#37bfbf]/45">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#486177]">Programma info</p>
                        <p className="mt-1.5 text-sm font-semibold text-[#2b445f] leading-relaxed">
                          {slot.notes?.trim() || "Voeg in admin een korte beschrijving toe voor dit programma."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {featuredSlot ? (
            <article className="hidden lg:block rounded-2xl border border-[#d1d9e5] bg-white overflow-hidden shadow-sm">
              <div className="relative aspect-square">
                {assetSrc(featuredSlot.programImagePath || featuredSlot.jock.imagePath) ? (
                  <AppImage
                    src={assetSrc(featuredSlot.programImagePath || featuredSlot.jock.imagePath)!}
                    alt={featuredSlot.jock.name}
                    className="w-full h-full object-cover"
                    style={featuredSlot.programImagePath ? undefined : { objectPosition: `${featuredSlot.jock.imageFocusX}% ${featuredSlot.jock.imageFocusY}%` }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-8 bg-[#1e375a]">
                    <AppImage src={MOCK_COVER_FALLBACK} alt="GLXY Radio" className="h-40 w-auto object-contain" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#10253f]/78 via-transparent to-transparent" />

                {featuredIsLive ? (
                  <div className="absolute right-3 top-2.5">
                    <span className="inline-flex items-center gap-2 justify-center leading-none rounded-full border bg-white/95 text-[10px] font-black px-2.5 py-1 tracking-[0.2em] uppercase text-[#1e375a] border-white/30">
                      <span className="inline-flex w-1.5 h-1.5 rounded-full kiss-live-dot" style={{ backgroundColor: "#ef4444" }} />
                      Live
                    </span>
                  </div>
                ) : null}

              </div>
              <div className="border-t border-[#d4ddea] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  {featuredSlot.startTime} - {featuredSlot.endTime}
                </p>
                <p className="mt-1 text-2xl font-black leading-tight text-gray-900 truncate">
                  {featuredSlot.label?.trim() || formatShowName(featuredSlot.jock.name)}
                </p>
                {!isNonStopProgram(featuredSlot) ? (
                  <p className="text-sm font-bold text-gray-600 truncate">
                    {featuredSlot.coHostName?.trim()
                      ? `${formatShowName(featuredSlot.jock.name)} & ${formatShowName(featuredSlot.coHostName)}`
                      : formatShowName(featuredSlot.jock.name)}
                  </p>
                ) : null}
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Programma info</p>
                <p className="mt-1 text-sm font-medium text-gray-700 leading-relaxed">
                  {featuredSlot.notes?.trim() || "Voeg in admin een korte beschrijving toe voor dit programma."}
                </p>
              </div>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
