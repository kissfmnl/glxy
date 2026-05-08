import { prisma } from "@/lib/prisma";
import { JoinKissPublic } from "@/components/public/JoinKissPublic";
import { mergeJoinKissBenefitsForDisplay, mergeJoinKissVacanciesForDisplay } from "@/lib/joinKissMerge";

export const dynamic = "force-dynamic";

const TEXT_KEYS = [
  "JOIN_KISS_PAGE_TITLE",
  "JOIN_KISS_INTRO",
  "JOIN_KISS_VACANCIES_TITLE",
  "JOIN_KISS_BENEFITS_TITLE",
] as const;

const DEFAULTS: Record<(typeof TEXT_KEYS)[number], string> = {
  JOIN_KISS_PAGE_TITLE: "Werken bij KISS FM",
  JOIN_KISS_INTRO:
    "De grootste poptracks van dit moment hebben een nieuwe sound nodig. Ben jij een echte hitradio-jock, producer of wil je op een andere manier meebouwen? KISS FM zoekt mensen met passie voor radio en muziek.",
  JOIN_KISS_VACANCIES_TITLE: "Vacatures",
  JOIN_KISS_BENEFITS_TITLE: "Waarom bij KISS werken",
};

export default async function JoinKissPage() {
  let vacRows: Awaited<ReturnType<typeof prisma.joinKissVacancy.findMany>> = [];
  let benRows: Awaited<ReturnType<typeof prisma.joinKissBenefit.findMany>> = [];
  try {
    [vacRows, benRows] = await Promise.all([
      prisma.joinKissVacancy.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.joinKissBenefit.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
  } catch {
    vacRows = [];
    benRows = [];
  }

  const vacancies = mergeJoinKissVacanciesForDisplay(vacRows);
  const benefits = mergeJoinKissBenefitsForDisplay(
    benRows.map((b) => ({
      title: b.title,
      body: b.body,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    }))
  );

  let texts = DEFAULTS;
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: [...TEXT_KEYS] } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    texts = {
      JOIN_KISS_PAGE_TITLE: map.get("JOIN_KISS_PAGE_TITLE") || DEFAULTS.JOIN_KISS_PAGE_TITLE,
      JOIN_KISS_INTRO: map.get("JOIN_KISS_INTRO") || DEFAULTS.JOIN_KISS_INTRO,
      JOIN_KISS_VACANCIES_TITLE: map.get("JOIN_KISS_VACANCIES_TITLE") || DEFAULTS.JOIN_KISS_VACANCIES_TITLE,
      JOIN_KISS_BENEFITS_TITLE: map.get("JOIN_KISS_BENEFITS_TITLE") || DEFAULTS.JOIN_KISS_BENEFITS_TITLE,
    };
  } catch {
    texts = DEFAULTS;
  }

  return (
    <JoinKissPublic
      pageTitle={texts.JOIN_KISS_PAGE_TITLE}
      intro={texts.JOIN_KISS_INTRO}
      vacanciesTitle={texts.JOIN_KISS_VACANCIES_TITLE}
      benefitsTitle={texts.JOIN_KISS_BENEFITS_TITLE}
      vacancies={vacancies}
      benefits={benefits}
    />
  );
}
