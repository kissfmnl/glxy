import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { hasPortalPermission } from "@/lib/portalPermissions";

/** Geen verticale hover-shift; alleen border/kleur. */
const cardClass =
  "group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm outline-none transition-colors duration-200 hover:border-brand-primary/45 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-brand-primary/50";

export default async function SiteSettingsHubPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");
  const role = String((session.user as { role?: string }).role || "");
  const isAdmin = role === "ADMIN";

  return (
    <PortalPageShell width="default">
      <div className="mb-10 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm dark:border-white/10 dark:from-white/[0.06] dark:to-transparent md:p-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Site instellingen</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600 dark:text-white/65">
          Homepage-inhoud, planning, radio, carrière en alle website-teksten. Profiel en account staan onder{" "}
          <Link href="/settings" className="font-black text-brand-primary underline-offset-2 transition-colors hover:underline">
            Systeem instellingen
          </Link>
          .
        </p>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/45">Homepage &amp; inhoud</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings/website-teksten" className={cardClass}>
              <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                Website-teksten
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                Teksten en opties per pagina (playlist, contact, giveaway, frequenties, homepagina, enz.).
              </span>
            </Link>
            <Link href="/settings/homepage" className={cardClass}>
              <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                Homepage instellingen
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                Homepage panelen, social panel inhoud en zichtbaarheid.
              </span>
            </Link>
            <Link href="/settings/site/general" className={cardClass}>
              <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                Algemeen
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                App-popup, cookie melding, favicon, fallback album-cover, radio/stream en frequenties (kaart &amp; appknoppen).
              </span>
            </Link>
            <Link href="/settings/concerten" className={cardClass}>
              <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                Concerten
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                Concerten op de homepage en op /concerten.
              </span>
            </Link>
            {isAdmin ? (
              <Link href="/admin/acties" className={cardClass}>
                <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                  Acties
                </span>
                <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                  Actie-afbeelding, sheet import (Google Sheets) en nummers (incl. album covers) voor Throwback.
                </span>
              </Link>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/45">Planning</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings/home-hero-planning" className={cardClass}>
              <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                Geplande titels (home)
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                Tijdelijke of vaste weekdagen-titels op de startpagina. Zonder actieve planning: website-teksten.
              </span>
            </Link>
            <Link href="/settings/programmering" className={cardClass}>
              <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                Programmering
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                Weekrooster en tijdsloten voor de publieke programmeringspagina.
              </span>
            </Link>
            <Link href="/settings/backup" className={cardClass}>
              <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                Backup &amp; herstel
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                Volledige export van inhoud (DJ&apos;s, programmering, teksten, concerten, …) en terugzetten uit een JSON-bestand.
              </span>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/45">Carrière</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings/join-kiss" className={cardClass}>
              <span className="text-lg font-black text-gray-900 transition-colors group-hover:text-brand-primary dark:text-white">
                Join KISS / vacatures
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                Vacaturekaarten en voordelen. Koppen en intro ook onder website-teksten (Join KISS).
              </span>
            </Link>
          </div>
        </section>
      </div>
    </PortalPageShell>
  );
}
