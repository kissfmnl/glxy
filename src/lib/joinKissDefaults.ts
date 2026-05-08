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
      "Ben jij een host die kan laten voelen wat er in de ether gebeurt? GLXY Radio (demo‑copy) zoekt stemmen voor een futuristische hitradio‑ervaring. Je bereidt shows voor, bent scherp op muziek & timing en houdt de luisteraar in de neon‑golf.",
    requirements:
      "Ervaring met radio of podcasting\nSterke stem en ritme\nPassie voor hitradio en nieuwe geluid\nBereid om in de avond/weekend live te gaan waar nodig",
    applyLabel: "Solliciteer",
    applyUrl: "mailto:hello@glxy.radio?subject=Sollicitatie%20DJ%20GLXY%20Radio",
  },
  {
    slot: "PRODUCER",
    sortOrder: 1,
    title: "Producer / techniek",
    category: "Productie",
    location: "Hybride",
    jobType: "Parttime / project",
    description:
      "Jij tilt shows technisch en creatief: geluid, edits, cues en een strakke stream. Samen met hosts en redactie bouw je aan een moderne cosmic sound voor GLXY.",
    requirements:
      "Ervaring met audio (DAW, studio of OB)\nOog voor detail en deadlines\nSamenwerken met hosts",
    applyLabel: "Solliciteer",
    applyUrl: "mailto:hello@glxy.radio?subject=Sollicitatie%20producer%20GLXY%20Radio",
  },
  {
    slot: "OTHER",
    sortOrder: 2,
    title: "Overige rollen",
    category: "Team GLXY",
    location: "Nederland",
    jobType: "In overleg",
    description:
      "Denk je dat GLXY bij je past maar zie je geen vacature die klopt? Laat weten waar je energie ligt — marketing, social, events, geluid … we horen graag van je.",
    requirements:
      "Korte motivatie\nPortfolio of CV\nWaar zie jij jezelf bij GLXY?",
    applyLabel: "Neem contact op",
    applyUrl: "mailto:hello@glxy.radio?subject=Open%20sollicitatie%20GLXY%20Radio",
  },
];

export type JoinKissBenefitDefault = { title: string; body: string; sortOrder: number };

export const DEFAULT_JOIN_BENEFITS: JoinKissBenefitDefault[] = [
  {
    sortOrder: 0,
    title: "Creatieve cultuur",
    body: "Een team dat leeft op muziek, radio en vizie — niet bang om te experimenteren.",
  },
  {
    sortOrder: 1,
    title: "Groeiruimte",
    body: "Ruimte om te leren, scherp te worden en jezelf uit te bouwen als het station groeit.",
  },
  {
    sortOrder: 2,
    title: "Werk-privébalans",
    body: "Roosters en afspraken in overleg; flexibel waar het kan.",
  },
  {
    sortOrder: 3,
    title: "Netwerk",
    body: "Dicht bij artiesten, events en partners in pop en media.",
  },
  {
    sortOrder: 4,
    title: "Moderne tooling",
    body: "Werken met serieuze audio- en stream-stack — studio en/of hybride.",
  },
  {
    sortOrder: 5,
    title: "Voorwaarden",
    body: "Een eerlijk voorstel bij de rol — altijd conform de wet en in gesprek.",
  },
];
