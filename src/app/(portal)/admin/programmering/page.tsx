import { authOptions } from "@/lib/auth";
import { isPortalAdmin } from "@/lib/authRoles";
import { MOCK_SCHEDULE } from "@/lib/mock/site";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProgrammingScheduleForm } from "./ProgrammingScheduleForm";

export const metadata = {
  title: "Programmering — GLXY",
};

export default async function AdminProgrammingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let initialJson = "";
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { programmingSchedule: true } });
    const raw = row?.programmingSchedule;
    if (Array.isArray(raw) && raw.length > 0) {
      initialJson = JSON.stringify(raw, null, 2);
    }
  } catch {
    /* database niet beschikbaar */
  }

  const example = JSON.stringify(MOCK_SCHEDULE.slice(0, 4), null, 2);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-[var(--text-main)]">Programmering</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Publieke homepage-widget en <span className="font-semibold">/programmering</span> gebruiken dit schema. Leeg laten en opslaan =
          terug naar ingebouwde demo-data.
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Elke regel: <code className="text-[var(--brand-yellow)]">weekday</code> (1=ma … 7=zo),{" "}
          <code className="text-[var(--brand-yellow)]">startHm</code>, <code className="text-[var(--brand-yellow)]">endHm</code> (HH:MM),{" "}
          <code className="text-[var(--brand-yellow)]">showName</code>, optioneel <code className="text-[var(--brand-yellow)]">djName</code>{" "}
          (naam uit hosts-demo).
        </p>
      </header>

      <details className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[var(--text-muted)]">
        <summary className="cursor-pointer font-black text-[var(--text-main)]">Voorbeeldfragment</summary>
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-white/85">{example}</pre>
      </details>

      <ProgrammingScheduleForm initialJson={initialJson} />
    </div>
  );
}
