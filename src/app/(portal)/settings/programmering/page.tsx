import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import {
  applyScheduleEditFromWeek,
  deleteSlot,
  deleteTemporarySlot,
  resetProgrammingData,
  upsertStandardChangeFromDate,
} from "@/app/actions/scheduleActions";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";
import { listWebsiteImageFiles } from "@/lib/websiteImageFiles";
import { hasPortalPermission } from "@/lib/portalPermissions";
import { temporarySlotDivergesFromBaseSchedule } from "@/lib/scheduleSlotPresentation";
import { ProgrammeringProgrammasTab } from "@/components/portal/ProgrammeringProgrammasTab";
import { parseProgramPresetsJson } from "@/lib/programPresets";
import { ProgrammingScheduleGrid } from "@/components/portal/ProgrammingScheduleGrid";
import { AnimatedModal } from "@/components/portal/AnimatedModal";

const days: { id: number; label: string }[] = [
  { id: 1, label: "Maandag" },
  { id: 2, label: "Dinsdag" },
  { id: 3, label: "Woensdag" },
  { id: 4, label: "Donderdag" },
  { id: 5, label: "Vrijdag" },
  { id: 6, label: "Zaterdag" },
  { id: 7, label: "Zondag" },
];
function formatShowName(value: string) {
  const v = value.trim().toLowerCase();
  if (v === "non-stop" || v === "nonstop" || v === "kiss non-stop" || v === "kiss nonstop") return "KISS Non-stop";
  return value;
}

function addDays(d: Date, daysToAdd: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + daysToAdd);
  return x;
}

function mondayFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const js = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() - (js - 1));
  return dt;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function overlapsWeek(slotStart: Date, slotEnd: Date, weekStart: Date, weekEnd: Date): boolean {
  return slotStart <= weekEnd && slotEnd >= weekStart;
}

function toMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
function toTime(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function colorFromProgramTitle(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  const h = hue / 60;
  const c = 0.7;
  const x = c * (1 - Math.abs((h % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 1) [r, g, b] = [c, x, 0];
  else if (h < 2) [r, g, b] = [x, c, 0];
  else if (h < 3) [r, g, b] = [0, c, x];
  else if (h < 4) [r, g, b] = [0, x, c];
  else if (h < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = 0.18;
  return `#${toHex(Math.round((r + m) * 255))}${toHex(Math.round((g + m) * 255))}${toHex(Math.round((b + m) * 255))}`;
}

export default async function SettingsProgrammeringPage({
  searchParams,
}: {
  searchParams?: {
    week?: string;
    saved?: string;
    tab?: string;
    editMode?: string;
    editDay?: string;
    editStart?: string;
    editEnd?: string;
    editDate?: string;
    editSlotId?: string;
    editSource?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  const jocks = await prisma.jock.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const slots = await prisma.scheduleSlot.findMany({
    include: { jock: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  const temporarySlots = await prisma.scheduleTemporarySlot.findMany({
    include: { jock: true },
    orderBy: [{ startsOn: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const currentWeekStart = mondayFromYmd(formatAmsterdamYMD());
  const imageOptions = await listWebsiteImageFiles();
  const presetsRow = await prisma.siteSetting.findUnique({
    where: { key: "PROGRAM_PRESETS_JSON" },
    select: { value: true },
  });
  const programPresets = parseProgramPresetsJson(presetsRow?.value);
  const requestedWeek = (searchParams?.week || "").trim();
  const selectedWeekStart =
    /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek) ? mondayFromYmd(requestedWeek) : currentWeekStart;
  const selectedWeekEnd = addDays(selectedWeekStart, 6);
  const weekDays = days.map((d, idx) => ({
    ...d,
    date: addDays(selectedWeekStart, idx),
    ymd: ymd(addDays(selectedWeekStart, idx)),
  }));
  const baseRows = slots.map((b) => ({
    dayOfWeek: b.dayOfWeek,
    startTime: b.startTime,
    endTime: b.endTime,
    jockId: b.jockId,
    coHostName: b.coHostName,
    label: b.label,
    notes: b.notes,
    programImagePath: b.programImagePath,
  }));
  const activeWeekTemp = temporarySlots.filter(
    (s) =>
      overlapsWeek(s.startsOn, s.endsOn, selectedWeekStart, selectedWeekEnd) &&
      temporarySlotDivergesFromBaseSchedule(
        {
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          jockId: s.jockId,
          coHostName: s.coHostName,
          label: s.label,
          notes: s.notes,
          programImagePath: s.programImagePath,
        },
        baseRows
      )
  );
  function withNonStopFill<T extends { dayOfWeek: number; startTime: string; endTime: string }>(
    list: T[],
    mapper: (item: T) => {
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
    }
  ) {
    const out: ReturnType<typeof mapper>[] = [];
    for (let day = 1; day <= 7; day++) {
      const dayList = list
        .filter((s) => s.dayOfWeek === day)
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
      let cursor = 7 * 60;
      for (const slot of dayList) {
        const slotStart = toMinutes(slot.startTime);
        const slotEnd = toMinutes(slot.endTime);
        if (slotStart > cursor) {
          out.push({
            id: `nonstop-${day}-${cursor}-${slotStart}`,
            dayOfWeek: day,
            startTime: toTime(cursor),
            endTime: toTime(slotStart),
            title: "KISS Non-stop",
            jockName: "KISS Non-stop",
            isTemporary: false,
            source: "base",
          } as ReturnType<typeof mapper>);
        }
        out.push(mapper(slot));
        cursor = Math.max(cursor, slotEnd);
      }
      if (cursor < 24 * 60) {
        out.push({
          id: `nonstop-${day}-${cursor}-${24 * 60}`,
          dayOfWeek: day,
          startTime: toTime(cursor),
          endTime: "23:59",
          title: "KISS Non-stop",
          jockName: "KISS Non-stop",
          isTemporary: false,
          source: "base",
        } as ReturnType<typeof mapper>);
      }
    }
    return out;
  }
  const fixedGridSlots = withNonStopFill(slots, (s) => ({
    id: s.id,
    slotId: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    title: formatShowName((s.label ?? "").trim() || s.jock.name),
    jockName: formatShowName(s.jock.name),
    coHostName: s.coHostName ? formatShowName(s.coHostName) : null,
    programColor: (s as any).programColor ?? null,
    isTemporary: false,
    source: "base" as const,
  }));
  const mergedWeekSlots = weekDays.flatMap((d) =>
    mergeScheduleSlotsForDay(slots, temporarySlots, d.ymd, d.id).map((s) => ({
      ...s,
      __dayYmd: d.ymd,
    }))
  );
  const weekGridSlots = withNonStopFill(mergedWeekSlots, (s) => ({
    id: `${(s as any).__dayYmd}-${s.id}`,
    slotId: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    title: formatShowName((s.label ?? "").trim() || s.jock.name),
    jockName: formatShowName(s.jock.name),
    coHostName: s.coHostName ? formatShowName(s.coHostName) : null,
    programColor: (s as any).programColor ?? null,
    isTemporary: s.source === "temp",
    source: s.source === "temp" ? ("temp" as const) : ("base" as const),
  }));

  const tab = searchParams?.tab === "programmas" ? "programmas" : "week";
  const weekStartYmd = ymd(selectedWeekStart);
  const editMode = searchParams?.editMode === "fixed" ? "fixed" : searchParams?.editMode === "week" ? "week" : null;
  const editDay = Number(searchParams?.editDay || 0);
  const editStart = (searchParams?.editStart || "").trim();
  const editEnd = (searchParams?.editEnd || "").trim();
  const editDate = (searchParams?.editDate || "").trim();
  const editSlotId = (searchParams?.editSlotId || "").trim();
  const editSource = searchParams?.editSource === "temp" ? "temp" : "base";
  const hasQuickEditor =
    tab === "week" &&
    Boolean(editMode) &&
    editDay >= 1 &&
    editDay <= 7 &&
    /^\d{2}:\d{2}$/.test(editStart) &&
    /^\d{2}:\d{2}$/.test(editEnd);
  const quickWeekDate =
    editDate && /^\d{4}-\d{2}-\d{2}$/.test(editDate)
      ? editDate
      : weekDays.find((d) => d.id === editDay)?.ymd || weekStartYmd;
  const quickExistingSlot = (() => {
    if (!hasQuickEditor) return null;
    if (editMode === "fixed") {
      if (editSlotId) return slots.find((s) => s.id === editSlotId) ?? null;
      return slots.find((s) => s.dayOfWeek === editDay && s.startTime === editStart && s.endTime === editEnd) ?? null;
    }
    const merged = mergeScheduleSlotsForDay(slots, temporarySlots, quickWeekDate, editDay);
    if (editSlotId) {
      const byId = merged.find((s) => s.id === editSlotId && s.source === editSource);
      if (byId) return byId;
    }
    return merged.find((s) => s.startTime === editStart && s.endTime === editEnd) ?? null;
  })();
  const existingProgramChoices = (() => {
    const map = new Map<string, { jockId: string; label: string | null; notes: string | null; coHostName: string | null; programColor: string | null }>();
    for (const s of slots) {
      const key = `${s.jockId}|${(s.label ?? "").trim()}|${(s.notes ?? "").trim()}|${(s.coHostName ?? "").trim()}`;
      if (!map.has(key)) {
        map.set(key, {
          jockId: s.jockId,
          label: (s.label ?? "").trim() || null,
          notes: (s.notes ?? "").trim() || null,
          coHostName: (s.coHostName ?? "").trim() || null,
          programColor: (s as any).programColor ?? null,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      formatShowName(a.label || jocks.find((j) => j.id === a.jockId)?.name || "").localeCompare(
        formatShowName(b.label || jocks.find((j) => j.id === b.jockId)?.name || ""),
        "nl"
      )
    );
  })();
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  if (tab === "programmas" && !isAdmin) {
    redirect(`/settings/programmering?tab=week&week=${encodeURIComponent(weekStartYmd)}`);
  }
  const weekTabHref = `/settings/programmering?tab=week&week=${encodeURIComponent(weekStartYmd)}`;
  const programmasTabHref = `/settings/programmering?tab=programmas&week=${encodeURIComponent(weekStartYmd)}`;

  return (
    <PortalPageShell width="wide" className="space-y-8">
      <Link
        href="/settings/site"
        className="inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Programmering</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Beheer per week de actuele planning en voer wijzigingen door naar een nieuwe standaard.
        </p>
        <div className="mt-4 inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/5">
          <Link
            href={weekTabHref}
            className={`rounded-xl px-4 py-2 text-xs font-black transition-colors ${
              tab === "week" ? "bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
            }`}
          >
            Week
          </Link>
          {isAdmin ? (
            <Link
              href={programmasTabHref}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-colors ${
                tab === "programmas" ? "bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
              }`}
            >
              Programma&apos;s
            </Link>
          ) : null}
        </div>
      </div>
      {searchParams?.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          Wijziging opgeslagen.
        </div>
      ) : null}

      <div className="space-y-6">
        {tab === "programmas" ? (
          <ProgrammeringProgrammasTab
            slots={slots}
            jocks={jocks}
            imageOptions={imageOptions}
            weekQuery={weekStartYmd}
            presets={programPresets}
          />
        ) : null}

        {tab === "week" ? (
          <>
        <ProgrammingScheduleGrid
          title={`Weekplanning (${ymd(selectedWeekStart)} t/m ${ymd(selectedWeekEnd)})`}
          subtitle="Schema voor deze week inclusief tijdelijke wijzigingen."
          slots={weekGridSlots}
          basePath="/settings/programmering"
          weekYmd={weekStartYmd}
          mode="week"
          dayDates={Object.fromEntries(weekDays.map((d) => [d.id, d.ymd]))}
          headerActions={
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/settings/programmering?tab=week&week=${ymd(addDays(selectedWeekStart, -7))}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700" aria-label="Vorige week">
                ←
              </Link>
              <Link href="/settings/programmering?tab=week" className="inline-flex h-9 items-center rounded-full border border-[#1e375a] bg-[#1e375a] px-4 text-xs font-black text-white">
                Deze week
              </Link>
              <Link href={`/settings/programmering?tab=week&week=${ymd(addDays(selectedWeekStart, 7))}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700" aria-label="Volgende week">
                →
              </Link>
            </div>
          }
        />
        <ProgrammingScheduleGrid
          title="Vaste programmering"
          subtitle="Standaard schema met uren links en weekdagen bovenin."
          slots={fixedGridSlots}
          basePath="/settings/programmering"
          weekYmd={weekStartYmd}
          mode="fixed"
          dayDates={Object.fromEntries(weekDays.map((d) => [d.id, d.ymd]))}
        />
        {hasQuickEditor ? (
          <AnimatedModal
            closeHref={`/settings/programmering?tab=week&week=${encodeURIComponent(weekStartYmd)}`}
            title={editMode === "fixed" ? "Vaste programmering aanpassen" : "Weekplanning aanpassen"}
            subtitle={`Tijdvak: ${days.find((d) => d.id === editDay)?.label} ${editStart}–${editEnd}${editMode === "week" ? ` · ${quickWeekDate}` : ""}`}
          >
              {editMode === "fixed" ? (
                <form
                  action={async (formData) => {
                    "use server";
                    await upsertStandardChangeFromDate(formData);
                    redirect(`/settings/programmering?tab=week&week=${encodeURIComponent(weekStartYmd)}&saved=1`);
                  }}
                  encType="multipart/form-data"
                  className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-12"
                >
                  <input type="hidden" name="dayOfWeek" value={String(editDay)} />
                  <div className="md:col-span-12 text-[11px] font-black uppercase tracking-widest text-[#1e375a]/70">Planning</div>
                  <input name="startTime" defaultValue={editStart} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <input name="endTime" defaultValue={editEnd} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Vanaf datum</label>
                    <input name="effectiveFrom" type="date" defaultValue={weekStartYmd} required className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" />
                  </div>
                  <input
                    type="color"
                    name="programColor"
                    defaultValue={(quickExistingSlot as any)?.programColor ?? colorFromProgramTitle(formatShowName((quickExistingSlot?.label ?? "").trim() || quickExistingSlot?.jock?.name || "KISS Non-stop"))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 py-1 md:col-span-2"
                  />
                  <div className="md:col-span-12 text-[11px] font-black uppercase tracking-widest text-[#1e375a]/70">Programma inhoud</div>
                  <select name="jockId" defaultValue={quickExistingSlot?.jockId ?? ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-4">
                    {jocks.map((j) => (
                      <option key={`quick-fixed-j-${j.id}`} value={j.id}>
                        {formatShowName(j.name)}
                      </option>
                    ))}
                  </select>
                  <select name="coHostName" defaultValue={quickExistingSlot?.coHostName ?? ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-4">
                    <option value="">Geen co-host</option>
                    {jocks.map((j) => (
                      <option key={`quick-fixed-c-${j.id}`} value={j.name}>
                        {formatShowName(j.name)}
                      </option>
                    ))}
                  </select>
                  <select name="existingProgramJson" defaultValue="" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-6">
                    <option value="">Of kies bestaand programma</option>
                    {existingProgramChoices.map((p, idx) => {
                      const name = formatShowName(p.label || jocks.find((j) => j.id === p.jockId)?.name || "Programma");
                      return (
                        <option key={`quick-existing-fixed-${idx}`} value={JSON.stringify(p)}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                  <input name="label" defaultValue={quickExistingSlot?.label ?? ""} placeholder="Programma naam" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-12" />
                  <textarea
                    name="notes"
                    defaultValue={quickExistingSlot?.notes ?? ""}
                    placeholder="Programmatekst"
                    rows={4}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-12"
                  />
                  <div className="md:col-span-12 mt-1 flex flex-wrap items-center justify-end gap-2">
                  <button type="submit" className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-black text-white">
                    Tijdvak opslaan
                  </button>
                  {editSlotId ? (
                    <button
                      type="submit"
                      formAction={async () => {
                        "use server";
                        await deleteSlot(editSlotId);
                        redirect(`/settings/programmering?tab=week&week=${encodeURIComponent(weekStartYmd)}&saved=1`);
                      }}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700"
                    >
                      Programma verwijderen
                    </button>
                  ) : null}
                  </div>
                </form>
              ) : (
                <form
                  action={async (formData) => {
                    "use server";
                    await applyScheduleEditFromWeek(formData);
                    redirect(`/settings/programmering?tab=week&week=${encodeURIComponent(weekStartYmd)}&saved=1`);
                  }}
                  encType="multipart/form-data"
                  className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-12"
                >
                  <input type="hidden" name="source" value={editSource} />
                  <input type="hidden" name="id" value={editSlotId} />
                  <input type="hidden" name="dayOfWeek" value={String(editDay)} />
                  <input type="hidden" name="targetDate" value={quickWeekDate} />
                  <input type="hidden" name="weekStart" value={weekStartYmd} />
                  <div className="md:col-span-12 text-[11px] font-black uppercase tracking-widest text-[#1e375a]/70">Planning</div>
                  <input name="startTime" defaultValue={editStart} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <input name="endTime" defaultValue={editEnd} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <input type="hidden" name="applyScope" value="single_day" />
                  <input
                    type="color"
                    name="programColor"
                    defaultValue={(quickExistingSlot as any)?.programColor ?? colorFromProgramTitle(formatShowName((quickExistingSlot?.label ?? "").trim() || quickExistingSlot?.jock?.name || "KISS Non-stop"))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 py-1 md:col-span-2"
                  />
                  <div className="md:col-span-12 text-[11px] font-black uppercase tracking-widest text-[#1e375a]/70">Programma inhoud</div>
                  <select name="jockId" defaultValue={quickExistingSlot?.jockId ?? ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-4">
                    {jocks.map((j) => (
                      <option key={`quick-week-j-${j.id}`} value={j.id}>
                        {formatShowName(j.name)}
                      </option>
                    ))}
                  </select>
                  <select name="coHostName" defaultValue={quickExistingSlot?.coHostName ?? ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-4">
                    <option value="">Geen co-host</option>
                    {jocks.map((j) => (
                      <option key={`quick-week-c-${j.id}`} value={j.name}>
                        {formatShowName(j.name)}
                      </option>
                    ))}
                  </select>
                  <select name="existingProgramJson" defaultValue="" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-6">
                    <option value="">Of kies bestaand programma</option>
                    {existingProgramChoices.map((p, idx) => {
                      const name = formatShowName(p.label || jocks.find((j) => j.id === p.jockId)?.name || "Programma");
                      return (
                        <option key={`quick-existing-week-${idx}`} value={JSON.stringify(p)}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                  <input name="label" defaultValue={quickExistingSlot?.label ?? ""} placeholder="Programma naam" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-12" />
                  <textarea
                    name="notes"
                    defaultValue={quickExistingSlot?.notes ?? ""}
                    placeholder="Programmatekst"
                    rows={4}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-12"
                  />
                  <div className="md:col-span-12 mt-1 flex flex-wrap items-center justify-end gap-2">
                  <button type="submit" className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-black text-white">
                    Tijdvak opslaan
                  </button>
                  {editSlotId ? (
                    <button
                      type="submit"
                      formAction={async () => {
                        "use server";
                        if (editSource === "temp") await deleteTemporarySlot(editSlotId);
                        else await deleteSlot(editSlotId);
                        redirect(`/settings/programmering?tab=week&week=${encodeURIComponent(weekStartYmd)}&saved=1`);
                      }}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700"
                    >
                      Programma verwijderen
                    </button>
                  ) : null}
                  </div>
                </form>
              )}
          </AnimatedModal>
        ) : null}

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-black text-red-800">Programmering resetten</h2>
          <p className="mt-1 text-sm font-bold text-red-700">
            Verwijdert alle vaste en tijdelijke programmering zodat je opnieuw kunt beginnen.
          </p>
          <form
            action={async (formData) => {
              "use server";
              await resetProgrammingData(formData);
              redirect(`/settings/programmering?tab=week&week=${encodeURIComponent(weekStartYmd)}&saved=1`);
            }}
            className="mt-3 flex flex-wrap items-center gap-2"
          >
            <input
              name="confirmText"
              required
              placeholder="Typ RESET ter bevestiging"
              className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-bold text-red-900"
            />
            <button
              type="submit"
              className="rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
            >
              Alles resetten
            </button>
          </form>
        </div>
          </>
        ) : null}
      </div>

      <section className="rounded-3xl border border-[#d7e1ec] bg-[#f7fbff] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1e375a]">
            Live API-links (deze week + volgende week)
          </p>
          <span className="rounded-full border border-[#1e375a]/20 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#1e375a]">
            Altijd actueel
          </span>
        </div>
        <p className="mt-1 text-xs font-bold text-[#365579]">
          Deel deze links met externe tooling. Ze lezen live uit de planning-database.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#d3e2f1] bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1e375a]/70">JSON feed</p>
            <input
              readOnly
              value="/api/programmering-export"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-black text-gray-700"
            />
            <a
              href="/api/programmering-export"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-black text-gray-700"
            >
              Open JSON
            </a>
          </div>

          <div className="rounded-2xl border border-[#d3e2f1] bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1e375a]/70">Plain text feed</p>
            <input
              readOnly
              value="/api/programmering-export?format=txt"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-black text-gray-700"
            />
            <a
              href="/api/programmering-export?format=txt"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-black text-gray-700"
            >
              Open plain text
            </a>
          </div>
        </div>
      </section>
    </PortalPageShell>
  );
}
