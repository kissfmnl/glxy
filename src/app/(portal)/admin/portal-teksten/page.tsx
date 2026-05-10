import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/authRoles";
import { mergeAdminPortalCopy } from "@/lib/adminPortalCopy";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PortalTekstenForm } from "./PortalTekstenForm";

export const metadata = {
  title: "Portalteksten — GLXY",
};

export default async function AdminPortalTekstenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isSuperAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  let copy = mergeAdminPortalCopy(null);
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { adminPortalCopy: true } });
    copy = mergeAdminPortalCopy(row?.adminPortalCopy ?? null);
  } catch {
    /* db */
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-main)]">Portalteksten</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Alleen super-admin: korte toelichtingen bovenaan enkele admin-pagina&apos;s. Gebruikers met rol beheerder zien de teksten wel, maar kunnen ze hier niet wijzigen.
        </p>
      </header>
      <PortalTekstenForm defaults={copy} />
    </div>
  );
}
