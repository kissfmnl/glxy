import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { DeveloperOptionsClient } from "@/components/portal/DeveloperOptionsClient";
import { hasPortalPermission } from "@/lib/portalPermissions";

export default async function DeveloperSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageDeveloper")) redirect("/settings");

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    select: { showMockMessages: true },
  });

  return (
    <PortalPageShell width="narrow">
      <Link
        href="/settings"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar systeem instellingen
      </Link>
      <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Developer opties</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-white/65">
        Alleen voor test en demo. Voor het vullen van voorbeeldberichten kun je ook{" "}
        <Link href="/admin" className="font-black text-brand-primary hover:underline">
          Gebruikers
        </Link>{" "}
        gebruiken (mock berichten genereren).
      </p>
      <DeveloperOptionsClient initialShowMock={user?.showMockMessages ?? false} />
    </PortalPageShell>
  );
}
