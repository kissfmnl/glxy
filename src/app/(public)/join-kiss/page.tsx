import { JoinKissPublic } from "@/components/public/JoinKissPublic";
import { mergeJoinKissBenefitsForDisplay, mergeJoinKissVacanciesForDisplay } from "@/lib/joinKissMerge";

const texts = {
  JOIN_KISS_PAGE_TITLE: "Werken bij GLXY Radio",
  JOIN_KISS_INTRO:
    "We bouwen een futuristische hitradio-ervaring — van studio tot stream. Deze pagina toont standaard demo-vacatures (geen database).",
  JOIN_KISS_VACANCIES_TITLE: "Open roles",
  JOIN_KISS_BENEFITS_TITLE: "Waarom GLXY",
};

export default function JoinKissPage() {
  const vacancies = mergeJoinKissVacanciesForDisplay([]);
  const benefits = mergeJoinKissBenefitsForDisplay([]);

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
