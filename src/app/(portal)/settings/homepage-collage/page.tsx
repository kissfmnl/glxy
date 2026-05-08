import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { HomeHeroBackgroundsSection } from "@/components/portal/HomeHeroBackgroundsSection";
import { hasPortalPermission } from "@/lib/portalPermissions";

export default async function HomepageCollageSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  return (
    <PortalPageShell width="readable">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>
      <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Collage achtergrond</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
        Foto’s voor de collage op de homepagina (wave layout). Titels, polaroids en overige teksten staan bij{" "}
        <Link href="/settings/website-teksten" className="font-black text-brand-primary hover:underline">
          Website-teksten
        </Link>{" "}
        (tab Homepagina).
      </p>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
        <HomeHeroBackgroundsSection embedded className="mt-0" />
      </div>
    </PortalPageShell>
  );
}
