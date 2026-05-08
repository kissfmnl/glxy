import { getServerSession } from "next-auth";
import type { JoinKissBenefit, JoinKissVacancy } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { JoinKissSettingsClient } from "@/components/portal/JoinKissSettingsClient";
import { DEFAULT_JOIN_BENEFITS, DEFAULT_JOIN_VACANCIES, JOIN_KISS_SLOTS, type JoinKissSlot } from "@/lib/joinKissDefaults";
import type { VacRowState } from "@/components/portal/JoinKissSettingsClient";
import { listWebsiteImageFiles } from "@/lib/websiteImageFiles";
import { hasPortalPermission } from "@/lib/portalPermissions";

export const dynamic = "force-dynamic";

function buildInitialVacancies(rows: JoinKissVacancy[]): VacRowState[] {
  const map = new Map(rows.map((r) => [r.slot, r]));
  return JOIN_KISS_SLOTS.map((slot) => {
    const r = map.get(slot);
    const d = DEFAULT_JOIN_VACANCIES.find((x) => x.slot === slot)!;
    if (r) {
      return {
        slot: slot as JoinKissSlot,
        title: r.title,
        category: r.category,
        location: r.location,
        jobType: r.jobType,
        imagePath: r.imagePath ?? "",
        description: r.description,
        requirements: r.requirements,
        applyLabel: r.applyLabel,
        applyUrl: r.applyUrl,
        isActive: r.isActive,
      };
    }
    return {
      slot: slot as JoinKissSlot,
      title: d.title,
      category: d.category,
      location: d.location,
      jobType: d.jobType,
      imagePath: "",
      description: d.description,
      requirements: d.requirements,
      applyLabel: d.applyLabel,
      applyUrl: d.applyUrl,
      isActive: true,
    };
  });
}

export default async function JoinKissSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  let vacRows: JoinKissVacancy[] = [];
  let benRows: JoinKissBenefit[] = [];
  try {
    [vacRows, benRows] = await Promise.all([
      prisma.joinKissVacancy.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.joinKissBenefit.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
  } catch {
    vacRows = [];
    benRows = [];
  }

  const initialVacancies = buildInitialVacancies(vacRows);
  const selectableImages = await listWebsiteImageFiles();
  const initialBenefits =
    benRows.length > 0
      ? benRows.map((b) => ({ title: b.title, body: b.body }))
      : DEFAULT_JOIN_BENEFITS.map((b) => ({ title: b.title, body: b.body }));

  return (
    <PortalPageShell width="readable">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>
      <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Join KISS / vacatures</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
        Drie vaste plekken (DJ, producer, overig) en de voordelen-kaarten op de publieke pagina. Koppen en intro staan bij
        website-teksten.
      </p>
      <JoinKissSettingsClient
        key={`${vacRows.length}-${benRows.length}`}
        initialVacancies={initialVacancies}
        initialBenefits={initialBenefits}
        hasDbVacancies={vacRows.length > 0}
        hasDbBenefits={benRows.length > 0}
        selectableImages={selectableImages}
      />
    </PortalPageShell>
  );
}
