export const JOIN_KISS_SLOTS = ["DJ", "PRODUCER", "OTHER"] as const;
export type JoinKissSlot = (typeof JOIN_KISS_SLOTS)[number];

export const JOIN_KISS_SLOT_LABELS: Record<JoinKissSlot, string> = {
  DJ: "DJ",
  PRODUCER: "Producer",
  OTHER: "Overig",
};

export type JoinKissVacancyDefault = {
  slot: JoinKissSlot;
  title: string;
  category: string;
  location: string;
  jobType: string;
  description: string;
  requirements: string;
  applyLabel: string;
  applyUrl: string;
  sortOrder: number;
};

export const DEFAULT_JOIN_VACANCIES: JoinKissVacancyDefault[] = [
  {
    slot: "DJ",
    sortOrder: 0,
    title: "On-air talent",
    category: "Programmering",
    location: "Randstad / studio",
    jobType: "Parttime / freelance",
    description:
      "Ben jij een strakke hitradio-jock die weet hoe je een show laat knallen? KISS FM zoekt stemmen die de grootste poptracks van dit moment nóg strakker maken. Je werkt samen met het team, bereidt je uitzending voor en zorgt dat de luisteraar blijft hangen.",
    requirements:
      "Ervaring met radio of podcasting\nSterke stem en timing\nPassie voor hitradio en popmuziek\nBereid om in de avond/weekend te draaien",
    applyLabel: "Solliciteer",
    applyUrl: "mailto:info@kissfm.nl?subject=Sollicitatie%20DJ%20KISS%20FM",
  },
  {
    slot: "PRODUCER",
    sortOrder: 1,
    title: "Producer / techniek",
    category: "Productie",
    location: "Hybride",
    jobType: "Parttime / project",
    description:
      "Jij weet hoe je een show technisch en creatief tot zijn recht laat komen: geluid, edits, bumps en alles wat de uitzending strak maakt. Samen met DJs en het team bouw je aan een moderne, frisse sound.",
    requirements:
      "Ervaring met audio (DAW, studio of OB)\nOog voor detail en deadlines\nSamenwerken met hosts en redactie",
    applyLabel: "Solliciteer",
    applyUrl: "mailto:info@kissfm.nl?subject=Sollicitatie%20producer%20KISS%20FM",
  },
  {
    slot: "OTHER",
    sortOrder: 2,
    title: "Overige rollen",
    category: "Team KISS",
    location: "Nederland",
    jobType: "In overleg",
    description:
      "Denk je dat KISS FM en jij bij elkaar passen, maar past geen van de andere vacatures? Laat van je horen. We zijn altijd nieuwsgierig naar marketing, social, events, sales en andere talenten die het station sterker maken.",
    requirements:
      "Korte motivatie\nPortfolio of CV\nWaar zie jij jezelf bij KISS?",
    applyLabel: "Neem contact op",
    applyUrl: "mailto:info@kissfm.nl?subject=Open%20sollicitatie%20KISS%20FM",
  },
];

export type JoinKissBenefitDefault = { title: string; body: string; sortOrder: number };

export const DEFAULT_JOIN_BENEFITS: JoinKissBenefitDefault[] = [
  {
    sortOrder: 0,
    title: "Creatieve cultuur",
    body: "Werken met een team dat geïnspireerd is door muziek, radio en entertainment — en grenzen durft te verleggen.",
  },
  {
    sortOrder: 1,
    title: "Groeimogelijkheden",
    body: "Ruimte om te leren, mee te denken en jezelf te ontwikkelen binnen een groeiend mediabedrijf.",
  },
  {
    sortOrder: 2,
    title: "Werk-privébalans",
    body: "We houden rekening met roosters en welzijn; in overleg zijn flexibele invullingen mogelijk.",
  },
  {
    sortOrder: 3,
    title: "Connecties in de industrie",
    body: "Je staat dichtbij artiesten, events en partners in de muziek- en mediasector.",
  },
  {
    sortOrder: 4,
    title: "Moderne werkplek",
    body: "Professionele studio’s en tools om je werk goed te kunnen doen — op locatie en waar passend hybride.",
  },
  {
    sortOrder: 5,
    title: "Competitieve voorwaarden",
    body: "Een passend pakket voor de rol die je vervult — in overleg en conform de wet.",
  },
];
