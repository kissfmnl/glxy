import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { SITE_GENERAL_SETTINGS } from "@/lib/siteGeneralSettingsConfig";
import { saveSiteGeneralSettings } from "@/app/actions/siteGeneralSettingsActions";
import { listWebsiteImageFiles } from "@/lib/websiteImageFiles";
import { getFrequentiesBadgePaths } from "@/app/actions/frequentiesBadgeActions";
import { FrequentiesBadgesClient } from "@/components/portal/FrequentiesBadgesClient";
import { RadioDelayForm } from "../radio/RadioDelayForm";
import { hasPortalPermission } from "@/lib/portalPermissions";

export const dynamic = "force-dynamic";

export default async function SiteGeneralSettingsPage({ searchParams }: { searchParams?: { saved?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: SITE_GENERAL_SETTINGS.map((i) => i.key) } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const sections = Array.from(new Set(SITE_GENERAL_SETTINGS.map((i) => i.section)));

  const [selectableLogoFiles, frequentiesBadges] = await Promise.all([
    listWebsiteImageFiles(),
    getFrequentiesBadgePaths(),
  ]);
  const selectedFallbackLogo = (map.get("FALLBACK_ALBUM_LOGO_PATH") || "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png").trim();
  const selectedFavicon = (map.get("SITE_FAVICON_PATH") || "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png").trim();
  const { ios, android, coverageMap } = frequentiesBadges;

  return (
    <PortalPageShell width="default">
      <Link href="/settings/site" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary hover:underline">
        ← Terug naar site instellingen
      </Link>
      <div className="mb-8 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm dark:border-white/10 dark:from-white/[0.06] dark:to-transparent md:p-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Algemene site-instellingen</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600 dark:text-white/65">
          Popup, cookiemelding, favicon, fallback album-cover, radio/stream-vertraging en frequenties (kaart &amp; appknoppen).
        </p>
      </div>
      {searchParams?.saved === "1" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          Algemene instellingen opgeslagen.
        </div>
      ) : null}

      <form action={saveSiteGeneralSettings} encType="multipart/form-data" className="space-y-6">
        <div className="sticky top-2 z-30 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-[#1a1f2e]/95">
          <button className="w-full rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-primary/25 transition-colors hover:bg-brand-primary/90">
            Algemene instellingen opslaan
          </button>
        </div>

        {sections.map((section) => (
          <section key={section} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-5">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-white/55">{section}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {SITE_GENERAL_SETTINGS.filter((i) => i.section === section && i.key !== "FALLBACK_ALBUM_LOGO_PATH" && i.key !== "SITE_FAVICON_PATH").map((item) => (
                <div key={item.key} className={`space-y-2 ${item.type === "select" ? "rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.03]" : "md:col-span-2"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor={item.key} className="text-sm font-black text-gray-900 dark:text-white">{item.label}</label>
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
            {section === "Fallback album cover" ? (
              <div className="mt-4 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-2 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="space-y-2">
                  <label htmlFor="FALLBACK_ALBUM_LOGO_SELECT" className="text-sm font-black text-gray-900 dark:text-white">
                    Fallback album-cover logo kiezen
                  </label>
                  <select
                    id="FALLBACK_ALBUM_LOGO_SELECT"
                    name="FALLBACK_ALBUM_LOGO_SELECT"
                    defaultValue={selectedFallbackLogo}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    {selectableLogoFiles.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="FALLBACK_ALBUM_LOGO_UPLOAD" className="text-sm font-black text-gray-900 dark:text-white">
                    Of upload nieuwe logo-afbeelding
                  </label>
                  <input
                    id="FALLBACK_ALBUM_LOGO_UPLOAD"
                    name="FALLBACK_ALBUM_LOGO_UPLOAD"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml,image/x-icon,.ico"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>
            ) : null}
            {section === "Favicon" ? (
              <div className="mt-4 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-2 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="space-y-2">
                  <label htmlFor="SITE_FAVICON_SELECT" className="text-sm font-black text-gray-900 dark:text-white">
                    Favicon kiezen uit bestaande bestanden
                  </label>
                  <select
                    id="SITE_FAVICON_SELECT"
                    name="SITE_FAVICON_SELECT"
                    defaultValue={selectedFavicon}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    {selectableLogoFiles.map((f) => (
                      <option key={`fav-${f}`} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="SITE_FAVICON_UPLOAD" className="text-sm font-black text-gray-900 dark:text-white">
                    Of upload een nieuw favicon-bestand
                  </label>
                  <input
                    id="SITE_FAVICON_UPLOAD"
                    name="SITE_FAVICON_UPLOAD"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml,image/x-icon,.ico"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </form>

      <div className="mt-8 space-y-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-5">
          <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-white/55">Radio &amp; stream</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-white/65">
            Vertraging vóór &quot;Nu speelt&quot; en playlist. De playlist-log wordt ook periodiek bijgewerkt; ouder dan 7 dagen wordt
            automatisch verwijderd.
          </p>
          <RadioDelayForm />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-5">
          <h3 className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-white/55">
            Frequentiekaart &amp; appknoppen
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-white/65">
            Koppen en teksten op de pagina <Link href="/frequenties" className="font-black text-brand-primary hover:underline">Frequenties</Link>{" "}
            staan onder{" "}
            <Link href="/settings/website-teksten" className="font-black text-brand-primary hover:underline">
              Website-teksten
            </Link>
            .
          </p>
          <FrequentiesBadgesClient
            iosPath={ios}
            androidPath={android}
            coverageMapPath={coverageMap}
            imageOptions={selectableLogoFiles}
          />
        </section>
      </div>
    </PortalPageShell>
  );
}
