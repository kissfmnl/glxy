import { authOptions } from "@/lib/auth";
import { isPortalAdmin, isSuperAdmin } from "@/lib/authRoles";
import { mergeAdminPortalCopy } from "@/lib/adminPortalCopy";
import { AdminIntroHtml } from "@/components/portal/AdminIntroHtml";
import { mergePlayerUi } from "@/lib/playerUi";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayerUiForm } from "./PlayerUiForm";

export const metadata = {
  title: "Player & weergave — GLXY",
};

export default async function AdminPlayerUiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let defaults = mergePlayerUi(null);
  let portalIntro = mergeAdminPortalCopy(null).playerUiIntroHtml;
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 } });
    if (row?.playerUi) defaults = mergePlayerUi(row.playerUi);
    if (row) portalIntro = mergeAdminPortalCopy(row.adminPortalCopy ?? null).playerUiIntroHtml;
  } catch {
    /* db weg */
  }

  const showPortalTekstenLink = session.user.role ? isSuperAdmin(session.user.role) : false;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-[var(--text-main)]">Player & weergave</h1>
        <AdminIntroHtml html={portalIntro} />
        {showPortalTekstenLink ? (
          <p className="text-xs text-[var(--text-muted)]">
            <Link href="/admin/portal-teksten" className="font-semibold text-[var(--brand-yellow)] underline-offset-2 hover:underline">
              Portalteksten bewerken
            </Link>{" "}
            (super-admin)
          </p>
        ) : null}
      </header>
      <PlayerUiForm defaults={defaults} />
    </div>
  );
}
