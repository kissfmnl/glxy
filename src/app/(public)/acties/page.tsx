import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";

export const dynamic = "force-dynamic";

function websiteAssetUrl(rel: string | null | undefined) {
  const value = String(rel || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return "/api/assets/" + value.split("/").map(encodeURIComponent).join("/");
}

export default async function ActiesPage() {
  const [actions, actionImageRow, pageTitleRow, subtitleRow, cardStatusRow, cardTitleRow, cardBodyRow, cardCtaRow] = await Promise.all([
    prisma.publicAction.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.siteSetting.findUnique({ where: { key: "ACTION_THROWBACK_IMAGE_PATH" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTIES_PAGE_TITLE" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTIES_SUBTITLE" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTIES_THROWBACK_CARD_STATUS" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTIES_THROWBACK_CARD_TITLE" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTIES_THROWBACK_CARD_BODY" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTIES_THROWBACK_CARD_CTA" }, select: { value: true } }),
  ]);
  const pageTitle = pageTitleRow?.value?.trim() || "Acties";
  const subtitle = subtitleRow?.value?.trim() || "Overzicht van lopende acties. Doe mee en maak kans op leuke prijzen.";
  const legacyFallback = {
    image: websiteAssetUrl(actionImageRow?.value),
    status: cardStatusRow?.value?.trim() || "Lopend",
    title: cardTitleRow?.value?.trim() || "KISS Throwback Party",
    body: cardBodyRow?.value?.trim() || "Bedrijven kiezen samen met hun team de ultieme throwback playlist en maken kans op een prijs.",
    cta: cardCtaRow?.value?.trim() || "Naar actie",
    href: "/throwback",
  };
  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight text-[#1e375a] md:text-4xl">{pageTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600">{subtitle}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {(actions.length > 0 ? actions : [null]).map((a, idx) => {
          const image = websiteAssetUrl(a?.imagePath) || legacyFallback.image;
          const status = a?.statusLabel || legacyFallback.status;
          const title = a?.title || legacyFallback.title;
          const body = a?.body || legacyFallback.body;
          const cta = a?.ctaLabel || legacyFallback.cta;
          const href = a?.href || legacyFallback.href;
          return (
            <article key={a?.id ?? `legacy-${idx}`} className="rounded-3xl border border-[#1e375a]/12 bg-white p-6 shadow-sm">
              {image ? (
                <div className="mb-4 overflow-hidden rounded-2xl border border-[#d3e2f1] bg-[#f4f9ff]">
                  <img src={image} alt="" className="h-40 w-full object-cover" />
                </div>
              ) : null}
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#365579]">{status}</p>
              <h2 className="mt-2 text-2xl font-black text-[#1e375a]">{title}</h2>
              <p className="mt-2 text-sm font-medium text-gray-600">{body}</p>
              <Link
                href={href}
                className="mt-5 inline-flex rounded-xl bg-[#1e375a] px-4 py-2 text-sm font-black text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#162c49]"
              >
                {cta}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
