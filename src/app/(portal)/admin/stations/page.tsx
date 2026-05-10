import { authOptions } from "@/lib/auth";
import { isPortalAdmin, isSuperAdmin } from "@/lib/authRoles";
import { mergeAdminPortalCopy } from "@/lib/adminPortalCopy";
import { prisma } from "@/lib/prisma";
import { stationsForAdminFormDefaults } from "@/lib/glxyStations";
import { AdminIntroHtml } from "@/components/portal/AdminIntroHtml";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StationsAdminForm } from "./StationsAdminForm";

const FALLBACK_COLORS: Record<string, string> = {
  z1: "#e11d48",
  z2: "#84cc16",
  z3: "#facc15",
  z4: "#7dd3fc",
};

export const metadata = {
  title: "Zenders & streams — GLXY",
};

export default async function AdminStationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let defaults = {
    ...stationsForAdminFormDefaults(null),
    stationColors: { ...FALLBACK_COLORS },
  };

  let portalIntro = mergeAdminPortalCopy(null).stationsIntroHtml;

  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 } });
    if (row) {
      const sf = stationsForAdminFormDefaults(row.stationsConfig ?? null);
      defaults = {
        ...sf,
        stationColors:
          row.stationColors && typeof row.stationColors === "object" && !Array.isArray(row.stationColors)
            ? { ...FALLBACK_COLORS, ...(row.stationColors as Record<string, string>) }
            : { ...FALLBACK_COLORS },
      };
      portalIntro = mergeAdminPortalCopy(row.adminPortalCopy ?? null).stationsIntroHtml;
    }
  } catch {
    /* db off */
  }

  const showPortalTekstenLink = isSuperAdmin(session.user.role);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-[var(--text-main)]">Zenders & streams</h1>
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
      <StationsAdminForm defaults={defaults} />
    </div>
  );
}
