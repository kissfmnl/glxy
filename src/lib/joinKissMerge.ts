import {
  DEFAULT_JOIN_BENEFITS,
  DEFAULT_JOIN_VACANCIES,
  JOIN_KISS_SLOTS,
  type JoinKissSlot,
} from "@/lib/joinKissDefaults";

export type JoinKissVacancyView = {
  slot: JoinKissSlot;
  title: string;
  category: string;
  location: string;
  jobType: string;
  imagePath: string;
  description: string;
  requirements: string;
  applyLabel: string;
  applyUrl: string;
};

export type JoinKissBenefitView = { title: string; body: string };

type DbVacancy = {
  slot: string;
  title: string;
  category: string;
  location: string;
  jobType: string;
  description: string;
  requirements: string;
  applyLabel: string;
  applyUrl: string;
  imagePath: string | null;
  isActive: boolean;
};

/** Publieke weergave: DB-waarden, anders defaults; verborgen bij isActive false in DB. */
export function mergeJoinKissVacanciesForDisplay(dbRows: DbVacancy[]): JoinKissVacancyView[] {
  const map = new Map(dbRows.map((r) => [r.slot, r]));
  const out: JoinKissVacancyView[] = [];
  for (const slot of JOIN_KISS_SLOTS) {
    const row = map.get(slot);
    const def = DEFAULT_JOIN_VACANCIES.find((d) => d.slot === slot)!;
    if (row) {
      if (!row.isActive) continue;
      out.push({
        slot,
        title: row.title || def.title,
        category: row.category,
        location: row.location,
        jobType: row.jobType,
        imagePath: row.imagePath || "",
        description: row.description || def.description,
        requirements: row.requirements || def.requirements,
        applyLabel: row.applyLabel || def.applyLabel,
        applyUrl: row.applyUrl || def.applyUrl,
      });
    } else {
      out.push({
        slot,
        title: def.title,
        category: def.category,
        location: def.location,
        jobType: def.jobType,
        imagePath: "",
        description: def.description,
        requirements: def.requirements,
        applyLabel: def.applyLabel,
        applyUrl: def.applyUrl,
      });
    }
  }
  return out;
}

export function mergeJoinKissBenefitsForDisplay(
  dbRows: { title: string; body: string; isActive: boolean; sortOrder: number }[]
): JoinKissBenefitView[] {
  if (dbRows.length === 0) {
    return DEFAULT_JOIN_BENEFITS.map((b) => ({ title: b.title, body: b.body }));
  }
  return [...dbRows]
    .filter((r) => r.isActive && r.title.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({ title: r.title, body: r.body }));
}
