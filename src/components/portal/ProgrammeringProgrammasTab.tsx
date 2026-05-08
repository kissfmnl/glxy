import { redirect } from "next/navigation";
import Link from "next/link";
import type { Jock, ScheduleSlot } from "@prisma/client";
import {
  bulkUpdateScheduleSlotProgramFields,
  deleteProgramPreset,
  upsertProgramPreset,
} from "@/app/actions/scheduleActions";
import { normScheduleField } from "@/lib/scheduleSlotPresentation";
import type { ProgramPreset } from "@/lib/programPresets";

const dayDefs: { id: number; label: string; short: string }[] = [
  { id: 1, label: "Maandag", short: "Ma" },
  { id: 2, label: "Dinsdag", short: "Di" },
  { id: 3, label: "Woensdag", short: "Wo" },
  { id: 4, label: "Donderdag", short: "Do" },
  { id: 5, label: "Vrijdag", short: "Vr" },
  { id: 6, label: "Zaterdag", short: "Za" },
  { id: 7, label: "Zondag", short: "Zo" },
];

function formatShowName(value: string) {
  const v = value.trim().toLowerCase();
  if (v === "non-stop" || v === "nonstop" || v === "kiss non-stop" || v === "kiss nonstop") return "KISS Non-stop";
  return value;
}

function isNonStopValue(value: string | null | undefined) {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "non-stop" || v === "nonstop" || v === "kiss non-stop" || v === "kiss nonstop";
}

function programIdentityKey(s: ScheduleSlot & { jock: Jock }) {
  const title = normScheduleField(s.label) ? formatShowName(s.label || "") : formatShowName(s.jock.name);
  if (isNonStopValue(title) || isNonStopValue(s.jock.name)) return "program:kiss-non-stop";
  const cn = normScheduleField(s.coHostName).toLowerCase();
  return `program:${title.trim().toLowerCase()}|cohost:${cn}`;
}

function clusterKey(s: ScheduleSlot & { jock: Jock }) {
  return programIdentityKey(s);
}

function formatDayPattern(dayIds: number[]) {
  const sorted = Array.from(new Set(dayIds)).sort((a, b) => a - b);
  const wd = [1, 2, 3, 4, 5];
  const we = [6, 7];
  if (sorted.length === 5 && wd.every((d, i) => sorted[i] === d)) return "Werkdagen (ma–vr)";
  if (sorted.length === 2 && sorted[0] === 6 && sorted[1] === 7) return "Weekend (za–zo)";
  if (sorted.length === 7) return "Elke dag";
  return sorted
    .map((id) => dayDefs.find((d) => d.id === id)?.short ?? String(id))
    .join(", ");
}

function assetSrc(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  return "/api/assets/" + imagePath.split("/").map(encodeURIComponent).join("/");
}

export function ProgrammeringProgrammasTab({
  slots,
  jocks,
  imageOptions,
  weekQuery,
  presets,
}: {
  slots: (ScheduleSlot & { jock: Jock })[];
  jocks: Jock[];
  imageOptions: string[];
  /** ISO week-start (maandag) om terug te linken naar dezelfde week-tab. */
  weekQuery: string;
  presets: ProgramPreset[];
}) {
  const map = new Map<string, (ScheduleSlot & { jock: Jock })[]>();
  for (const s of slots) {
    const k = clusterKey(s);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(s);
  }
  const clusters = Array.from(map.values()).sort((a, b) => {
    const ta = `${a[0].startTime}|${a[0].jock.name}`;
    const tb = `${b[0].startTime}|${b[0].jock.name}`;
    return ta.localeCompare(tb, "nl");
  });
  const weekTabUrl = (() => {
    const qs = new URLSearchParams();
    qs.set("tab", "week");
    if (weekQuery) qs.set("week", weekQuery);
    return `/settings/programmering?${qs.toString()}`;
  })();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-card md:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Programma&apos;s (bulk)</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold text-gray-500">
            Compact overzicht in Studio 2.0-stijl. Programma&apos;s worden op naam gegroepeerd (incl. KISS Non-stop als 1 programma).
          </p>
        </div>
        <Link
          href={weekTabUrl}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-black text-gray-800 hover:border-brand-primary/40"
        >
          ← Weekplanning
        </Link>
      </div>
      <div className="mb-4 rounded-xl border border-[#b9c9dd] bg-[#edf4fd] p-3">
        <h3 className="text-sm font-black text-[#1e375a]">Programma templates</h3>
        <p className="mt-1 text-[11px] font-bold text-[#365579]">
          Sla standaardinstellingen op voor terugkerende shows en pas ze met 1 keuze toe in weekplanning of standaard-programmering.
        </p>
        <div className="mt-3 grid gap-3">
          <form
            action={async (formData) => {
              "use server";
              await upsertProgramPreset(formData);
              const qs = new URLSearchParams();
              qs.set("tab", "programmas");
              if (weekQuery) qs.set("week", weekQuery);
              qs.set("saved", "1");
              redirect(`/settings/programmering?${qs.toString()}`);
            }}
            className="grid grid-cols-1 gap-1.5 md:grid-cols-2"
          >
            <input name="name" required placeholder="Preset naam (bijv. Ochtendshow standaard)" className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold md:col-span-2" />
            <input name="label" placeholder="Programmanaam" className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold" />
            <select name="coHostName" defaultValue="" className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold">
              <option value="">Geen co-host</option>
              {jocks.map((j) => (
                <option key={`preset-cohost-${j.id}`} value={j.name}>
                  {formatShowName(j.name)}
                </option>
              ))}
            </select>
            <textarea name="notes" rows={2} placeholder="Programmatekst" className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold md:col-span-2" />
            <input type="color" name="programColor" defaultValue="#2dbbc4" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-2 py-1" />
            <select name="programImagePath" defaultValue="" className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold md:col-span-2">
              <option value="">Geen afbeelding</option>
              {imageOptions.map((f) => (
                <option key={`preset-image-${f}`} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-brand-primary px-3 py-2 text-[11px] font-black text-white md:col-span-2">
              Preset opslaan
            </button>
          </form>
          {presets.length > 0 ? (
            <div className="grid gap-2">
              {presets.map((preset) => (
                <form
                  key={preset.id}
                  action={async (formData) => {
                    "use server";
                    await upsertProgramPreset(formData);
                    const qs = new URLSearchParams();
                    qs.set("tab", "programmas");
                    if (weekQuery) qs.set("week", weekQuery);
                    qs.set("saved", "1");
                    redirect(`/settings/programmering?${qs.toString()}`);
                  }}
                  className="grid grid-cols-1 gap-1.5 rounded-lg border border-gray-200 bg-white p-2.5 md:grid-cols-4"
                >
                  <input type="hidden" name="id" value={preset.id} />
                  <input name="name" defaultValue={preset.name} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold" />
                  <input name="label" defaultValue={preset.label ?? ""} placeholder="Programmanaam" className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold" />
                  <input name="coHostName" defaultValue={preset.coHostName ?? ""} placeholder="Co-host naam" className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold" />
                  <input type="color" name="programColor" defaultValue={preset.programColor ?? "#2dbbc4"} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-2 py-1" />
                  <input name="programImagePath" defaultValue={preset.programImagePath ?? ""} placeholder="Afbeelding pad" className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold" />
                  <textarea name="notes" defaultValue={preset.notes ?? ""} rows={2} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold md:col-span-3" />
                  <div className="flex items-center gap-2 md:justify-end">
                    <button type="submit" className="rounded-lg bg-brand-primary px-3 py-2 text-[11px] font-black text-white">
                      Update
                    </button>
                    <button
                      type="submit"
                      formAction={async (formData) => {
                        "use server";
                        await deleteProgramPreset(formData);
                        const qs = new URLSearchParams();
                        qs.set("tab", "programmas");
                        if (weekQuery) qs.set("week", weekQuery);
                        qs.set("saved", "1");
                        redirect(`/settings/programmering?${qs.toString()}`);
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-black text-red-700"
                    >
                      Verwijder
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {clusters.length === 0 ? (
        <p className="text-sm font-bold text-gray-500">Nog geen vaste tijdsloten — voeg eerst programmering toe onder week / standaard.</p>
      ) : (
        <div className="space-y-2.5">
          {clusters.map((group) => {
            const first = group[0];
            const slotIds = group.map((g) => g.id);
            const dayIds = group.map((g) => g.dayOfWeek);
            const title = normScheduleField(first.label) ? formatShowName(first.label!.trim()) : formatShowName(first.jock.name);

            return (
              <details key={clusterKey(first)} className="rounded-xl border border-[#b9c9dd] bg-[#f4f8fc] open:shadow-sm">
                <summary className="cursor-pointer list-none px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#c5d2e2] bg-white">
                      {assetSrc(first.programImagePath || first.jock.imagePath) ? (
                        <img
                          src={assetSrc(first.programImagePath || first.jock.imagePath)!}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1e375a]/80">
                      {formatDayPattern(dayIds)} · {group.length} slot{group.length === 1 ? "" : "en"}
                    </p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{title}</p>
                    <p className="text-[11px] font-bold text-gray-600">
                      Tijden: {Array.from(new Set(group.map((g) => `${g.startTime}-${g.endTime}`))).join(", ")} ·{" "}
                      {formatShowName(first.jock.name)}
                      {normScheduleField(first.coHostName) ? ` + ${formatShowName(first.coHostName!)}` : ""}
                    </p>
                    </div>
                  </div>
                </summary>
                <form
                  action={async (formData) => {
                    "use server";
                    await bulkUpdateScheduleSlotProgramFields(formData);
                    const qs = new URLSearchParams();
                    qs.set("tab", "programmas");
                    if (weekQuery) qs.set("week", weekQuery);
                    qs.set("saved", "1");
                    redirect(`/settings/programmering?${qs.toString()}`);
                  }}
                  encType="multipart/form-data"
                  className="grid grid-cols-1 gap-1.5 border-t border-[#d7e4f1] px-3 pb-3 pt-2.5 md:grid-cols-2"
                >
                  <input type="hidden" name="slotIds" value={JSON.stringify(slotIds)} />
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Programma naam</label>
                    <input name="label" defaultValue={first.label ?? ""} className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Programmatekst (publiek)</label>
                    <textarea name="notes" defaultValue={first.notes ?? ""} rows={2} className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Co-host</label>
                    <select name="coHostName" defaultValue={first.coHostName ?? ""} className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold">
                      <option value="">Geen co-host</option>
                      {jocks.map((j) => (
                        <option key={`cohost-${clusterKey(first)}-${j.id}`} value={j.name}>
                          {formatShowName(j.name)}
                          {j.isActive ? "" : " (inactief)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Preset</label>
                    <select name="presetId" defaultValue="" className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold text-[#1e375a]">
                      <option value="">Geen preset</option>
                      {presets.map((p) => (
                        <option key={`${clusterKey(first)}-preset-${p.id}`} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Programmafoto</label>
                    <select name="programImageMode" defaultValue="keep" className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-black text-[#1e375a]">
                      <option value="keep">Onveranderd laten</option>
                      <option value="set">Vervangen (upload of kies bestand)</option>
                      <option value="clear">Overal verwijderen in deze groep</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <input name="programImageFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold" />
                  </div>
                  <div className="md:col-span-2">
                    <select name="programImagePath" defaultValue={first.programImagePath ?? ""} className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold">
                      <option value="">Geen bestaande foto gekozen</option>
                      {imageOptions.map((f) => (
                        <option key={`${clusterKey(first)}-${f}`} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  {assetSrc(first.programImagePath || first.jock.imagePath) ? (
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          <img
                            src={assetSrc(first.programImagePath || first.jock.imagePath)!}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Huidige afbeelding</p>
                          <p className="mt-1 truncate text-[11px] font-bold text-gray-700">
                            {first.programImagePath ? first.programImagePath : first.jock.imagePath}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className="md:col-span-2">
                    <button type="submit" className="rounded-lg bg-brand-primary px-3 py-2 text-[11px] font-black text-white hover:bg-brand-primary/90">
                      Opslaan op alle {group.length} slot{group.length === 1 ? "" : "en"}
                    </button>
                  </div>
                </form>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
