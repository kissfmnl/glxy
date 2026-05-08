import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { canAccessKiss40 } from "@/lib/kiss40Access";
import { createKiss40DraftWeek, deleteKiss40Week } from "@/app/actions/kiss40Actions";
import { ConfirmSubmitButton } from "@/components/portal/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

function formatWeek(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getIsoWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default async function Kiss40AdminPage({
  searchParams,
}: {
  searchParams?: { deleted?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!canAccessKiss40(session)) redirect("/settings");

  const weeks = await prisma.kiss40Week.findMany({ orderBy: { weekStart: "desc" } });

  return (
    <PortalPageShell width="default">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-500/35 dark:bg-amber-500/10 md:p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-200">In aanbouw</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">KISS40</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-amber-950/80 dark:text-white/80">
              Weeklijsten aanmaken en bewerken. Publieke weergave en Spotify volgen later. JSON-tracklijst is een tijdelijk
              formaat (array van objecten met o.a. positie, titel, artiest).
            </p>
          </div>
          <form action={createKiss40DraftWeek}>
            <button
              type="submit"
              className="rounded-2xl bg-[#1e375a] px-5 py-3 text-sm font-black text-white shadow-md transition-colors hover:bg-[#2a4a73]"
            >
              + Nieuwe week (concept)
            </button>
          </form>
        </div>
      </div>

      {searchParams?.deleted === "1" ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          KISS40-lijst verwijderd.
        </div>
      ) : null}

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/55">Weken</h2>
        {weeks.length === 0 ? (
          <p className="mt-4 text-sm font-bold text-gray-600 dark:text-white/65">Nog geen weken. Maak een concept aan.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/10">
            {weeks.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <Link
                    href={`/settings/kiss40/${w.id}`}
                    className="font-black text-[#1e375a] hover:underline dark:text-brand-primary"
                  >
                    {`KISS40 — week ${getIsoWeekNumber(w.weekStart)}`}
                  </Link>
                  <p className="text-xs font-bold text-gray-500 dark:text-white/50">
                    Start {formatWeek(w.weekStart)} ·{" "}
                    <span className={w.status === "published" ? "text-emerald-600" : "text-amber-700"}>{w.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={deleteKiss40Week}>
                    <input type="hidden" name="id" value={w.id} />
                    <ConfirmSubmitButton
                      type="submit"
                      confirmMessage="Weet je zeker dat je deze KISS40-lijst wilt verwijderen?"
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700 hover:bg-red-100"
                    >
                      Verwijderen
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PortalPageShell>
  );
}
