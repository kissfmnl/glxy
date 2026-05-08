import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { WebsiteTekstenForm } from "@/components/portal/WebsiteTekstenForm";
import { hasPortalPermission } from "@/lib/portalPermissions";

export default async function WebsiteTekstenSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  return (
    <PortalPageShell width="default">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary hover:underline"
      >
        ← Terug naar site instellingen
      </Link>
      <div className="mb-8 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm dark:border-white/10 dark:from-white/[0.06] dark:to-transparent md:p-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Website-teksten</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600 dark:text-white/65">
          Alle vaste teksten en keuzes per pagina-tab hieronder. <strong className="font-black text-gray-900 dark:text-white">Alles opslaan</strong>{" "}
          blijft bovenaan zichtbaar tijdens scrollen. Collage op de homepagina:{" "}
          <Link href="/settings/homepage-collage" className="font-black text-brand-primary underline-offset-2 transition-colors hover:underline">
            Collage achtergrond
          </Link>
          . Geplande startpagina-titels:{" "}
          <Link href="/settings/home-hero-planning" className="font-black text-brand-primary underline-offset-2 transition-colors hover:underline">
            Geplande titels (home)
          </Link>
          .
        </p>
      </div>

      <WebsiteTekstenForm />
    </PortalPageShell>
  );
}
