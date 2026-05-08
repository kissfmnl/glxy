import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { StudioBetaScheduler } from "@/components/portal/StudioBetaScheduler";
import { hasPortalPermission } from "@/lib/portalPermissions";

export default async function StudioBetaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "studioBeta")) redirect("/dashboard");

  const userName = String((session.user as any)?.name || "DJ");
  const userId = String((session.user as any)?.id || "").trim() || null;

  return (
    <PortalPageShell width="wide" className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-black text-amber-800">
        BETA IN ONTWIKKELING - nieuwe studio planner. De huidige pagina <code>/admin/studio</code> blijft gewoon bestaan.
      </div>
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Studio planner beta</h1>
        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          Snel beschikbaarheid zien, op tijdslot klikken, reserveringstype kiezen en daarna je agenda abonneren via een .ics-link met live updates.
        </p>
      </div>
      <StudioBetaScheduler userName={userName} userId={userId} />
    </PortalPageShell>
  );
}
