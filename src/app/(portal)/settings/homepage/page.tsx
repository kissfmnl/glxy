import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { HOMEPAGE_UI_SETTINGS } from "@/lib/homepageUiSettingsConfig";
import { saveHomepageSettings } from "@/app/actions/homepageSettingsActions";
import { HomeHeroBackgroundsSection } from "@/components/portal/HomeHeroBackgroundsSection";
import { hasPortalPermission } from "@/lib/portalPermissions";

export const dynamic = "force-dynamic";

export default async function HomepageSettingsPage({ searchParams }: { searchParams?: { saved?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: HOMEPAGE_UI_SETTINGS.map((i) => i.key) } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const sections = Array.from(new Set(HOMEPAGE_UI_SETTINGS.map((i) => i.section)));
  return (
    <PortalPageShell width="default">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary hover:underline"
      >
        ← Terug naar site instellingen
      </Link>
      <div className="mb-8 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm dark:border-white/10 dark:from-white/[0.06] dark:to-transparent md:p-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Homepage instellingen</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600 dark:text-white/65">
          Alle homepage panel-opties, social panel-inhoud en zichtbaarheid op één plek.
        </p>
      </div>
      {searchParams?.saved === "1" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          Homepage instellingen opgeslagen.
        </div>
      ) : null}

      <form action={saveHomepageSettings} className="space-y-6">
        <div className="sticky top-2 z-30 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-[#1a1f2e]/95">
          <button className="w-full rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-primary/25 transition-colors hover:bg-brand-primary/90">
            Homepage instellingen opslaan
          </button>
        </div>

        {sections.map((section) => (
          <section key={section} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-5">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-white/55">{section}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {HOMEPAGE_UI_SETTINGS.filter((i) => i.section === section).map((item) => (
                <div key={item.key} className={`space-y-2 ${item.type === "select" ? "rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.03]" : "md:col-span-2"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor={item.key} className="text-sm font-black text-gray-900 dark:text-white">{item.label}</label>
                    {item.type !== "select" ? <code className="text-[10px] font-bold text-gray-400 dark:text-white/35">{item.key}</code> : null}
                  </div>
                  {item.type === "select" ? (
                    <select
                      id={item.key}
                      name={item.key}
                      defaultValue={(map.get(item.key) ?? item.fallback).trim().toLowerCase()}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      {(item.options || []).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : item.type === "textarea" ? (
                    <textarea
                      id={item.key}
                      name={item.key}
                      defaultValue={map.get(item.key) ?? item.fallback}
                      rows={item.rows ?? 3}
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  ) : (
                    <input
                      id={item.key}
                      name={item.key}
                      defaultValue={map.get(item.key) ?? item.fallback}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-5">
          <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-white/55">Collage achtergrond</h3>
          <HomeHeroBackgroundsSection embedded className="mt-0" />
        </section>
      </form>
    </PortalPageShell>
  );
}
