import { prisma } from "@/lib/prisma";
import { ProgrammingAgenda } from "@/components/public/ProgrammingAgenda";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";

export const dynamic = "force-dynamic";

export default async function ProgrammeringPage() {
  const [slots, temporarySlots, subtitleRow, liveBadgeRow] = await Promise.all([
    prisma.scheduleSlot.findMany({
      include: { jock: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.scheduleTemporarySlot.findMany({
      where: { isActive: true },
      include: { jock: true },
      orderBy: [{ startsOn: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.siteSetting.findUnique({
      where: { key: "PROGRAMMERING_SUBTITLE" },
      select: { value: true },
    }),
    prisma.siteSetting.findUnique({
      where: { key: "PROGRAMMERING_LIVE_BADGE" },
      select: { value: true },
    }),
  ]);
  const subtitle = subtitleRow?.value || "Dit hoor je deze week op KISS FM.";
  const liveBadgeText = liveBadgeRow?.value || "Nu op radio";

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--brand-navy)" }}>
          Programmering
        </h1>
        <p className="mt-3 text-gray-600 max-w-2xl">{subtitle}</p>
      </div>

      {slots.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6">
          <p className="text-sm font-bold text-gray-700">Nog geen programmering — voeg tijdsloten toe onder site-instellingen.</p>
        </div>
      ) : (
        <ProgrammingAgenda slots={slots} temporarySlots={temporarySlots} liveBadgeText={liveBadgeText} />
      )}
    </div>
  );
}

