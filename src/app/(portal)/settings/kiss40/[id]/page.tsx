import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { canAccessKiss40 } from "@/lib/kiss40Access";
import { importKiss40FromXlsx, updateKiss40Week } from "@/app/actions/kiss40Actions";
import { Kiss40TracksEditor } from "@/components/portal/Kiss40TracksEditor";

export const dynamic = "force-dynamic";

function getIsoWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default async function Kiss40WeekEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { saved?: string; importError?: string; saveError?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!canAccessKiss40(session)) redirect("/settings");

  const week = await prisma.kiss40Week.findUnique({ where: { id: params.id } });
  if (!week) notFound();
  const prevWeek = await prisma.kiss40Week.findFirst({
    where: { weekStart: { lt: week.weekStart } },
    orderBy: { weekStart: "desc" },
    select: { tracksJson: true, weekStart: true },
  });

  const weekLabel = week.weekStart.toISOString().slice(0, 10);
  const canonicalWeekTitle = `KISS40 — week ${getIsoWeekNumber(week.weekStart)}`;

  return (
    <PortalPageShell width="default">
      <Link
        href="/settings/kiss40"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar KISS40
      </Link>

      {searchParams?.saved === "1" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          Opgeslagen.
        </div>
      ) : null}
      {searchParams?.importError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          XLSX import mislukt: {searchParams.importError}
        </div>
      ) : null}
      {searchParams?.saveError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          Opslaan mislukt: {searchParams.saveError}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs font-bold text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-100">
        In aanbouw — week start (UTC-maandag): {weekLabel}
      </div>

      <form action={updateKiss40Week} className="space-y-6">
        <input type="hidden" name="id" value={week.id} />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
          <label htmlFor="kiss40-title" className="block text-xs font-black uppercase tracking-widest text-gray-400">
            Titel
          </label>
          <input
            id="kiss40-title"
            name="title"
            defaultValue={canonicalWeekTitle}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />

          <label htmlFor="kiss40-status" className="mt-5 block text-xs font-black uppercase tracking-widest text-gray-400">
            Status
          </label>
          <select
            id="kiss40-status"
            name="status"
            defaultValue={week.status}
            className="mt-2 w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="draft">Concept</option>
            <option value="published">Gepubliceerd</option>
          </select>

          <label className="mt-5 block text-xs font-black uppercase tracking-widest text-gray-400">
            Tracklijst (editor)
          </label>
          <Kiss40TracksEditor
            initialTracksJson={week.tracksJson}
            previousTracksJson={prevWeek?.tracksJson || "[]"}
            weekLabel={weekLabel}
          />

          <label htmlFor="kiss40-notes" className="mt-5 block text-xs font-black uppercase tracking-widest text-gray-400">
            Interne notities
          </label>
          <textarea
            id="kiss40-notes"
            name="notes"
            rows={4}
            defaultValue={week.notes}
            className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />

          <button
            type="submit"
            className="mt-6 rounded-2xl bg-brand-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand-primary/20 hover:opacity-95"
          >
            Opslaan
          </button>
        </div>
      </form>

      <form action={importKiss40FromXlsx} encType="multipart/form-data" className="mt-6">
        <input type="hidden" name="id" value={week.id} />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Importeer XLSX</h2>
          <p className="mt-2 text-xs font-bold text-gray-600 dark:text-white/65">
            Ondersteunt kolommen zoals DW, VW, AW (of NEW), STS, Artiest en Titel. De header mag ook op een latere rij
            staan (bijv. na een titelbalk). DW + Artiest + Titel blijven verplicht.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              name="xlsxFile"
              accept=".xlsx,.xls"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
              required
            />
            <button
              type="submit"
              className="shrink-0 rounded-2xl bg-[#1e375a] px-5 py-3 text-xs font-black text-white shadow-md transition-colors hover:bg-[#2a4a73]"
            >
              XLSX importeren
            </button>
          </div>
        </div>
      </form>
    </PortalPageShell>
  );
}
