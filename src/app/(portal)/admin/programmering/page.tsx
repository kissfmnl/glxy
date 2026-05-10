import { authOptions } from "@/lib/auth";
import { isPortalAdmin } from "@/lib/authRoles";
import { editorRowsFromBrandingJson } from "@/lib/programmingScheduleRows";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProgrammingScheduleEditor } from "./ProgrammingScheduleEditor";

export const metadata = {
  title: "Programmering — GLXY",
};

export default async function AdminProgrammingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let rawSchedule: unknown = null;
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { programmingSchedule: true } });
    rawSchedule = row?.programmingSchedule ?? null;
  } catch {
    /* database niet beschikbaar */
  }

  const initialRows = editorRowsFromBrandingJson(rawSchedule);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-[var(--text-main)]">Programmering</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Bouw het schema met blokken per dag en tijdvak. Dit voedt de homepage-widget en de pagina{" "}
          <span className="font-semibold">/programmering</span>.{" "}
          <span className="font-semibold text-[var(--brand-yellow)]">Demo herstellen</span> wist je schema en laadt het
          ingebouwde voorbeeld opnieuw.
        </p>
      </header>

      <ProgrammingScheduleEditor initialRows={initialRows} />
    </div>
  );
}
