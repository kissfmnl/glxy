import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import { JOIN_KISS_SLOT_LABELS } from "@/lib/joinKissDefaults";
import type { JoinKissBenefitView, JoinKissVacancyView } from "@/lib/joinKissMerge";
import { websiteAssetUrl } from "@/lib/websiteAssetUrl";
import AppImage from "@/components/AppImage";

const sectionShell = "rounded-3xl border border-[#d3dae4] bg-[#eef2f6] p-5 shadow-sm md:p-6";

const benefitCard =
  "rounded-2xl border border-[#d1d9e5] bg-white p-5 shadow-sm transition-colors duration-200 hover:border-[#37bfbf]/40 sm:p-5";

const metaIconClass = "h-4 w-4 shrink-0 text-[#1e375a]/45";

function IconPin() {
  return (
    <svg className={metaIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg className={metaIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function VacancyCard({ v }: { v: JoinKissVacancyView }) {
  const bullets = v.requirements
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const category = v.category || JOIN_KISS_SLOT_LABELS[v.slot];
  const loc = v.location?.trim() || "";
  const job = v.jobType?.trim() || "";
  const hasMeta = Boolean(loc || job);
  const imageSrc = websiteAssetUrl(v.imagePath);
  const imageCacheKey = encodeURIComponent((v.imagePath || "").trim());

  const showVacancyImage = Boolean(imageSrc);

  return (
    <article className="rounded-2xl border border-[#1e375a]/10 bg-white p-6 shadow-[0_4px_24px_rgba(30,55,90,0.07)] md:p-8">
      {showVacancyImage ? (
        <div className="mb-5 aspect-[16/7] w-full overflow-hidden rounded-2xl border border-[#d1d9e5] bg-[#f2f8fb]">
          <AppImage
            src={imageSrc ? `${imageSrc}?v=${imageCacheKey}` : ""}
            alt={v.title}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>
      ) : null}
      <div className="flex flex-row items-start justify-between gap-3 border-b border-gray-100 pb-4 sm:gap-6">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="text-lg font-black leading-snug text-[#1e375a] md:text-xl">{v.title}</h3>
          {category ? <p className="mt-1 text-sm font-semibold text-gray-500">{category}</p> : null}
        </div>
        {hasMeta ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5 text-right pl-2 sm:max-w-[17rem] sm:pl-0">
            {loc ? (
              <div className="flex items-start justify-end gap-2 text-xs font-bold leading-relaxed text-gray-600">
                <IconPin />
                <span className="min-w-0 text-right sm:max-w-[16rem]">{loc}</span>
              </div>
            ) : null}
            {job ? (
              <div className="flex items-start justify-end gap-2 text-xs font-bold leading-relaxed text-gray-600">
                <IconBriefcase />
                <span className="min-w-0 text-right sm:max-w-[16rem]">{job}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-gray-600 md:text-[15px]">{v.description}</p>

      {bullets.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-black text-[#1e375a]">Vereisten:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-gray-600">
            {bullets.map((b) => (
              <li key={b} className="leading-relaxed">
                {b}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
        <a
          href={v.applyUrl}
          className="inline-flex items-center justify-center rounded-xl bg-[#37bfbf] px-6 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#2da8a8]"
        >
          {v.applyLabel}
        </a>
      </div>
    </article>
  );
}

export function JoinKissPublic({
  pageTitle,
  intro,
  vacanciesTitle,
  benefitsTitle,
  vacancies,
  benefits,
}: {
  pageTitle: string;
  intro: string;
  vacanciesTitle: string;
  benefitsTitle: string;
  vacancies: JoinKissVacancyView[];
  benefits: JoinKissBenefitView[];
}) {
  return (
    <div className={`${PUBLIC_PAGE_SHELL} min-h-[calc(100dvh-9rem)]`}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          {pageTitle}
        </h1>
        {intro.trim() ? <p className="mt-3 max-w-2xl text-gray-600">{intro}</p> : null}

        <h2 className="mt-10 text-xl font-black tracking-tight text-[#1e375a] md:text-2xl">{vacanciesTitle}</h2>
        <div className="mt-5 flex flex-col gap-6 sm:gap-7">
          {vacancies.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#1e375a]/20 bg-white/80 p-8 text-center text-sm font-bold text-gray-600">
              Er zijn momenteel geen openstaande vacatures.
            </p>
          ) : (
            vacancies.map((v) => <VacancyCard key={v.slot} v={v} />)
          )}
        </div>

        <div className={`mt-12 ${sectionShell}`}>
          <h2 className="text-xl font-black tracking-tight text-[#1e375a] md:text-2xl">{benefitsTitle}</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {benefits.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-[#1e375a]/15 bg-white/90 p-6 text-sm font-bold text-gray-600 sm:col-span-2 lg:col-span-3">
                Voordelen worden zo snel mogelijk toegevoegd.
              </p>
            ) : (
              benefits.map((b, i) => (
                <div key={`${i}-${b.title.slice(0, 24)}`} className={benefitCard}>
                  <h3 className="text-base font-black text-[#1e375a]">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{b.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
