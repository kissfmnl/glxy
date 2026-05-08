"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertHomeHeroHeadlineSlot,
  deleteHomeHeroHeadlineSlot,
  setHomeHeroHeadlineSlotActive,
} from "@/app/actions/homeHeroScheduleActions";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { BRAND_TEAL_HEX, heroColorToPickerHex } from "@/lib/heroTitleColor";
import { heroSlotAppliesOnYmd } from "@/lib/pickHomeHeroHeadlineSlot";

export type HeroSlotRow = {
  id: string;
  startsOn: string;
  endsOn: string;
  weekdays: string | null;
  startTime: string | null;
  endTime: string | null;
  titleLine1: string;
  titleLine2: string | null;
  titleLine1Color: string;
  titleLine2Color: string;
  priority: number;
  isActive: boolean;
  note: string | null;
};

const WD = [
  { v: 1, l: "Ma" },
  { v: 2, l: "Di" },
  { v: 3, l: "Wo" },
  { v: 4, l: "Do" },
  { v: 5, l: "Vr" },
  { v: 6, l: "Za" },
  { v: 7, l: "Zo" },
] as const;

function formatWeekdaysLabel(csv: string | null): string {
  if (!csv?.trim()) return "elke dag";
  const set = new Set(
    csv
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => n >= 1 && n <= 7)
  );
  if (set.size === 0) return "elke dag";
  if (set.size === 7) return "elke dag";
  if ([1, 2, 3, 4, 5].every((d) => set.has(d)) && set.size === 5) return "ma–vr";
  if ([6, 7].every((d) => set.has(d)) && set.size === 2) return "za–zo";
  const names = ["", "ma", "di", "wo", "do", "vr", "za", "zo"];
  return Array.from(set)
    .sort((a, b) => a - b)
    .map((d) => names[d])
    .join(", ");
}

function ymdToNum(ymd: string) {
  return parseInt(ymd.slice(0, 10).replace(/-/g, ""), 10) || 0;
}

function slotStatusPill(s: HeroSlotRow, today: string): { label: string; className: string } {
  if (!s.isActive) {
    return { label: "Uit", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
  }
  if (today < s.startsOn) {
    const n = Math.ceil(
      (new Date(s.startsOn + "T12:00:00Z").getTime() - new Date(today + "T12:00:00Z").getTime()) / 86400000
    );
    const label = n === 1 ? "Start morgen" : `Start over ${n} dagen`;
    return { label, className: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" };
  }
  if (today > s.endsOn) {
    return { label: "Afgelopen", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500" };
  }
  if (heroSlotAppliesOnYmd(s, today)) {
    return { label: "Nu actief", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200" };
  }
  return {
    label: "In periode (niet vandaag)",
    className: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200",
  };
}

function rankSlot(s: HeroSlotRow, today: string): { tier: number; tie: number } {
  if (!s.isActive) return { tier: 50, tie: -ymdToNum(s.endsOn) };
  if (today < s.startsOn) return { tier: 10, tie: ymdToNum(s.startsOn) };
  if (today > s.endsOn) return { tier: 40, tie: -ymdToNum(s.endsOn) };
  if (heroSlotAppliesOnYmd(s, today)) return { tier: 0, tie: -s.priority };
  return { tier: 20, tie: ymdToNum(s.startsOn) };
}

function sortHeroSlots(slots: HeroSlotRow[], today: string): HeroSlotRow[] {
  return [...slots].sort((a, b) => {
    const ra = rankSlot(a, today);
    const rb = rankSlot(b, today);
    if (ra.tier !== rb.tier) return ra.tier - rb.tier;
    return ra.tie - rb.tie;
  });
}

function weekdayChecked(editing: HeroSlotRow | null, day: number): boolean {
  if (!editing?.weekdays?.trim()) return false;
  const set = new Set(
    editing.weekdays
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => n >= 1 && n <= 7)
  );
  return set.has(day);
}

function HeroColorPickers({
  line,
  defaultStored,
  name,
}: {
  line: 1 | 2;
  defaultStored: string;
  name: "titleLine1Color" | "titleLine2Color";
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const def = (defaultStored?.trim() || (line === 1 ? "white" : "teal")).trim();
  const pickerDefault = heroColorToPickerHex(def);

  return (
    <div className="space-y-1.5">
      <span className="mb-0.5 block text-xs font-black uppercase tracking-wide text-gray-500">Kleur regel {line}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={pickerRef}
          type="color"
          aria-label={`Kleur titel regel ${line}`}
          defaultValue={pickerDefault}
          className="h-10 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white p-0 dark:border-gray-600"
          onChange={(e) => {
            const v = e.target.value.toLowerCase();
            if (hiddenRef.current) hiddenRef.current.value = v;
          }}
        />
        <input ref={hiddenRef} type="hidden" name={name} defaultValue={def} />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="rounded-full border border-gray-300 px-2.5 py-1 text-[11px] font-black text-gray-800 dark:border-gray-600 dark:text-gray-200"
            onClick={() => {
              if (hiddenRef.current) hiddenRef.current.value = "white";
              if (pickerRef.current) pickerRef.current.value = "#ffffff";
            }}
          >
            Wit
          </button>
          <button
            type="button"
            className="rounded-full border border-gray-300 px-2.5 py-1 text-[11px] font-black text-gray-800 dark:border-gray-600 dark:text-gray-200"
            onClick={() => {
              if (hiddenRef.current) hiddenRef.current.value = "teal";
              if (pickerRef.current) pickerRef.current.value = BRAND_TEAL_HEX;
            }}
          >
            Teal
          </button>
        </div>
      </div>
      <p className="text-[10px] leading-snug text-gray-500 dark:text-gray-400">
        Kleurkiezer voor eigen tint; Wit/Teal = standaard huisstijl.
      </p>
    </div>
  );
}

export function HomeHeroScheduleClient({ initialSlots }: { initialSlots: HeroSlotRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editingSlot, setEditingSlot] = useState<HeroSlotRow | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const today = formatAmsterdamYMD();
  const sortedSlots = useMemo(() => sortHeroSlots(initialSlots, today), [initialSlots, today]);

  function setWeekdayChecks(days: number[] | "all") {
    const form = formRef.current;
    if (!form) return;
    form.querySelectorAll<HTMLInputElement>('input[name="weekday"]').forEach((cb) => {
      const n = Number(cb.value);
      if (days === "all") cb.checked = false;
      else cb.checked = days.includes(n);
    });
  }

  function presetCalendarYearWeekdays(days: number[] | "all") {
    const form = formRef.current;
    if (!form) return;
    const y = new Date().getFullYear();
    const start = form.elements.namedItem("startsOn") as HTMLInputElement;
    const end = form.elements.namedItem("endsOn") as HTMLInputElement;
    if (start && end) {
      start.value = `${y}-01-01`;
      end.value = `${y}-12-31`;
    }
    setWeekdayChecks(days);
  }

  const formKey = editingSlot?.id ?? "new";

  return (
    <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-5">
      <div className="xl:col-span-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900/40">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {editingSlot ? "Periode bewerken" : "Nieuwe planning"}
          </h2>
          {editingSlot ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditingSlot(null)}
              className="text-xs font-black text-[#37bfbf] underline-offset-2 hover:underline"
            >
              Annuleren
            </button>
          ) : null}
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Kies een <strong>datumbereik</strong> en optioneel <strong>welke dagen in de week</strong> de titels gelden (bijv. alleen ma–vr).
          Lege weekdagen = <strong>elke dag</strong> in dat bereik. Buiten actieve periodes: vaste titels onder{" "}
          <a
            href="/settings/website-teksten"
            className="font-bold text-[#37bfbf] underline-offset-2 transition-colors hover:underline"
          >
            Website-teksten
          </a>{" "}
          (tab Homepagina). Bij overlap wint de hoogste <strong>priority</strong>.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="w-full text-[10px] font-black uppercase tracking-wide text-gray-500">
            Snel invullen (datums + weekdagen)
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => presetCalendarYearWeekdays("all")}
            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            Heel {new Date().getFullYear()} · elke dag
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => presetCalendarYearWeekdays([1, 2, 3, 4, 5])}
            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            Heel {new Date().getFullYear()} · ma–vr
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => presetCalendarYearWeekdays([6, 7])}
            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            Heel {new Date().getFullYear()} · za–zo
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setWeekdayChecks("all")}
            className="rounded-full border border-dashed border-gray-400 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-400"
          >
            Weekdagen leegmaken (= elke dag)
          </button>
        </div>

        <form
          key={formKey}
          ref={formRef}
          className="grid gap-4 sm:grid-cols-2"
          action={(fd) => {
            start(async () => {
              try {
                await upsertHomeHeroHeadlineSlot(fd);
                setEditingSlot(null);
                router.refresh();
              } catch (e) {
                alert(e instanceof Error ? e.message : "Opslaan mislukt");
              }
            });
          }}
        >
          {editingSlot ? <input type="hidden" name="slotId" value={editingSlot.id} /> : null}
          <label className="sm:col-span-1">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500">Startdatum</span>
            <input
              name="startsOn"
              type="date"
              required
              defaultValue={editingSlot?.startsOn}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="sm:col-span-1">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500">Einddatum (inclusief)</span>
            <input
              name="endsOn"
              type="date"
              required
              defaultValue={editingSlot?.endsOn}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="sm:col-span-1">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500">Starttijd (optioneel)</span>
            <input
              name="startTime"
              type="time"
              defaultValue={editingSlot?.startTime ?? ""}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="sm:col-span-1">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500">Eindtijd (optioneel)</span>
            <input
              name="endTime"
              type="time"
              defaultValue={editingSlot?.endTime ?? ""}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>

          <fieldset className="sm:col-span-2">
            <legend className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
              Weekdagen (optioneel)
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {WD.map(({ v, l }) => (
                <label key={v} className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    name="weekday"
                    value={v}
                    defaultChecked={weekdayChecked(editingSlot, v)}
                    className="rounded border-gray-300"
                  />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500">
              Titel regel 1 (bijv. Fijne maandag!)
            </span>
            <input
              name="titleLine1"
              type="text"
              required
              defaultValue={editingSlot?.titleLine1 ?? ""}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500">
              Titel regel 2 (optioneel; leeg = standaard uit website-teksten)
            </span>
            <input
              name="titleLine2"
              type="text"
              defaultValue={editingSlot?.titleLine2 ?? ""}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <div className="sm:col-span-1">
            <HeroColorPickers line={1} name="titleLine1Color" defaultStored={editingSlot?.titleLine1Color ?? "white"} />
          </div>
          <div className="sm:col-span-1">
            <HeroColorPickers line={2} name="titleLine2Color" defaultStored={editingSlot?.titleLine2Color ?? "teal"} />
          </div>
          <label>
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500">Priority (0–100)</span>
            <input
              name="priority"
              type="number"
              min={0}
              max={100}
              defaultValue={editingSlot?.priority ?? 10}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-500">
              Interne notitie (optioneel)
            </span>
            <input
              name="note"
              type="text"
              defaultValue={editingSlot?.note ?? ""}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[#1e375a] px-6 py-2.5 text-sm font-black text-white hover:bg-[#2a4a73] disabled:opacity-50 xl:w-auto"
            >
              {editingSlot ? "Wijzigingen opslaan" : "Toevoegen"}
            </button>
          </div>
        </form>
      </div>

      <div className="xl:col-span-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Actieve / geplande periodes ({initialSlots.length})</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vandaag (NL): {today}</p>
        </div>
        {initialSlots.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Nog geen planning — alleen vaste titels uit website-teksten.</p>
        ) : (
          <ul className="space-y-4">
            {sortedSlots.map((s) => {
              const pill = slotStatusPill(s, today);
              const isEditing = editingSlot?.id === s.id;
              return (
                <li
                  key={s.id}
                  className={`rounded-2xl border p-4 shadow-sm ${
                    isEditing
                      ? "border-[#37bfbf] bg-teal-50/40 dark:border-teal-700 dark:bg-teal-950/20"
                      : s.isActive
                        ? "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900/40"
                        : "border-dashed border-gray-300 opacity-80 dark:border-gray-600"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${pill.className}`}>
                      {pill.label}
                    </span>
                    {isEditing ? (
                      <span className="text-[10px] font-black uppercase tracking-wide text-[#37bfbf]">Bezig met bewerken</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                        {s.startsOn} t/m {s.endsOn} · {formatWeekdaysLabel(s.weekdays)}{s.startTime && s.endTime ? ` · ${s.startTime}-${s.endTime}` : ""}
                        {s.note ? ` · ${s.note}` : ""}
                      </p>
                      <p className="mt-1 text-base font-black text-gray-900 dark:text-white">{s.titleLine1}</p>
                      {s.titleLine2 ? <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{s.titleLine2}</p> : null}
                      <p className="mt-1 text-xs text-gray-500">
                        priority {s.priority} · {s.titleLine1Color}/{s.titleLine2Color}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setEditingSlot(s)}
                        className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-black text-gray-800 dark:border-gray-600 dark:text-gray-200"
                      >
                        Bewerken
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            await setHomeHeroHeadlineSlotActive(s.id, !s.isActive);
                            router.refresh();
                          })
                        }
                        className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-black text-gray-800 dark:border-gray-600 dark:text-gray-200"
                      >
                        {s.isActive ? "Uitzetten" : "Aanzetten"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (!confirm("Deze periode verwijderen?")) return;
                          start(async () => {
                            await deleteHomeHeroHeadlineSlot(s.id);
                            setEditingSlot((cur) => (cur?.id === s.id ? null : cur));
                            router.refresh();
                          });
                        }}
                        className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-black text-red-700 dark:border-red-800 dark:text-red-400"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
