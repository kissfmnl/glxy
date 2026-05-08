import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { RadioDelayForm } from "./RadioDelayForm";
import { hasPortalPermission } from "@/lib/portalPermissions";

export default async function RadioSiteSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  return (
    <PortalPageShell width="narrow">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>
      <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Radio &amp; playlist</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-white/65">
        Vertraging vóór de weergave van het huidige nummer. De playlist-log wordt ook elke minuut bijgewerkt (cron), onafhankelijk
        van siteverkeer; ouder dan 7 dagen wordt automatisch verwijderd.
      </p>
      <RadioDelayForm />
    </PortalPageShell>
  );
}
