import { ProgrammingAgenda } from "@/components/public/ProgrammingAgenda";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import { getMockProgrammingData } from "@/lib/mock/site";

export default function ProgrammeringPage() {
  const { slots, temporarySlots } = getMockProgrammingData();
  const subtitle = "Demo-programmering voor GLXY Radio — dit is fictieve weekdata.";
  const liveBadgeText = "Nu op stream";

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          Programmering
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">{subtitle}</p>
      </div>

      {slots.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6">
          <p className="text-sm font-bold text-gray-700">Geen demo-slots.</p>
        </div>
      ) : (
        <ProgrammingAgenda slots={slots} temporarySlots={temporarySlots} liveBadgeText={liveBadgeText} />
      )}
    </div>
  );
}
