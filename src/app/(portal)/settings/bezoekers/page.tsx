import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { hasPortalPermission } from "@/lib/portalPermissions";
import { VisitorsLiveStatsClient } from "@/components/portal/VisitorsLiveStatsClient";

export const dynamic = "force-dynamic";

function shortHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default async function VisitorsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageVisitors")) redirect("/settings");

  const now = new Date();
  const d1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total, last24h, last7d, topPaths, topCities, latest, latestForPeople, latestForTimeline] = await Promise.all([
    prisma.visitEvent.count(),
    prisma.visitEvent.count({ where: { createdAt: { gte: d1 } } }),
    prisma.visitEvent.count({ where: { createdAt: { gte: d7 } } }),
    prisma.visitEvent.groupBy({ by: ["path"], _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 10 }),
    prisma.visitEvent.groupBy({ by: ["city"], _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 10 }),
    prisma.visitEvent.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.visitEvent.findMany({ where: { createdAt: { gte: d7 } }, select: { ipHash: true } }),
    prisma.visitEvent.findMany({ where: { createdAt: { gte: d1 } }, select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const uniquePeople7d = (() => {
    const known = new Set<string>();
    let unknown = 0;
    for (const v of latestForPeople) {
      if (v.ipHash) known.add(v.ipHash);
      else unknown += 1;
    }
    return known.size + unknown;
  })();
  const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const v of latestForTimeline) {
    const h = new Date(v.createdAt).getHours();
    hourlyBuckets[h].count += 1;
  }
  const maxHourCount = Math.max(1, ...hourlyBuckets.map((b) => b.count));
  const currentHour = new Date().getHours();
  const currentHourCount = hourlyBuckets.find((b) => b.hour === currentHour)?.count ?? 0;
  const maxBucket = hourlyBuckets.reduce((best, cur) => (cur.count > best.count ? cur : best), hourlyBuckets[0]);

  return (
    <PortalPageShell width="wide" className="space-y-6">
      <Link href="/settings/site" className="inline-flex items-center gap-2 text-sm font-black text-brand-primary hover:underline">
        ← Terug naar site instellingen
      </Link>
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Bezoekers</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Overzicht van bezoekers, plaatsen en populairste pagina&apos;s.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-black text-gray-500">Totaal</p><p className="mt-1 text-3xl font-black text-[#1e375a]">{total}</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-black text-gray-500">Laatste 24u</p><p className="mt-1 text-3xl font-black text-[#1e375a]">{last24h}</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-black text-gray-500">Laatste 7 dagen</p><p className="mt-1 text-3xl font-black text-[#1e375a]">{last7d}</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-black text-gray-500">Unieke mensen (7d)</p><p className="mt-1 text-3xl font-black text-[#1e375a]">{uniquePeople7d}</p></div>
      </div>

      <VisitorsLiveStatsClient />

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-gray-900">Bezoekmomenten (laatste 24 uur)</h2>
        <p className="mt-1 text-xs font-bold text-gray-500">Per uur zie je wanneer bezoekers op de site kwamen.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-black text-gray-700">
            Nu ({shortHourLabel(currentHour)}): {currentHourCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-black text-gray-700">
            Piek ({shortHourLabel(maxBucket.hour)}): {maxBucket.count}
          </span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <div className="flex w-full min-w-[560px] items-end justify-between gap-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
            {hourlyBuckets.map((b) => (
              <div key={`h-${b.hour}`} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-black text-gray-500 tabular-nums">{b.count}</span>
                <div className="relative h-28 w-full max-w-[28px] rounded bg-white">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded bg-[#2dbbc4]"
                    style={{ height: `${Math.max(2, (b.count / maxHourCount) * 100)}%` }}
                    title={`${shortHourLabel(b.hour)} - ${b.count} bezoeken`}
                  />
                </div>
                <span className="text-[9px] font-black text-gray-500">{String(b.hour).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Top pagina&apos;s</h2>
          <div className="mt-3 space-y-2">
            {topPaths.map((p) => (
              <div key={p.path} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-bold text-gray-800">{p.path}</span>
                <span className="font-black text-[#1e375a]">{p._count._all}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Top plaatsen</h2>
          <div className="mt-3 space-y-2">
            {topCities.map((c) => (
              <div key={c.city || "onbekend"} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-bold text-gray-800">{c.city || "Onbekend"}</span>
                <span className="font-black text-[#1e375a]">{c._count._all}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-gray-900">Recente bezoeken</h2>
        <div className="mt-3 max-h-[420px] space-y-2 overflow-auto">
          {latest.map((v) => (
            <div key={v.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
              <p className="font-black text-gray-900">{v.path}</p>
              <p>{new Date(v.createdAt).toLocaleString("nl-NL")} · {v.city || "Onbekend"}</p>
              <p className="truncate">Referrer: {v.referrer || "-"}</p>
              <p className="truncate">IP hash: {v.ipHash || "-"}</p>
            </div>
          ))}
        </div>
      </section>
    </PortalPageShell>
  );
}
