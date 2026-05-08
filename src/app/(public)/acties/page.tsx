import Link from "next/link";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import AppImage from "@/components/AppImage";
import { MOCK_ACTIONS } from "@/lib/mock/site";

export default function ActiesPage() {
  const pageTitle = "Acties";
  const subtitle = "Demo-acties voor GLXY Radio — alles is statisch.";

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight text-[#1e375a] md:text-4xl">{pageTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600">{subtitle}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {MOCK_ACTIONS.map((a) => (
          <article key={a.slug} className="rounded-3xl border border-[#1e375a]/12 bg-white p-6 shadow-sm">
            {a.imagePath ? (
              <div className="mb-4 overflow-hidden rounded-2xl border border-[#d3e2f1] bg-[#f4f9ff]">
                <AppImage src={a.imagePath} alt="" className="h-40 w-full object-cover" />
              </div>
            ) : null}
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#365579]">Lopend · demo</p>
            <h2 className="mt-2 text-2xl font-black text-[#1e375a]">{a.title}</h2>
            <p className="mt-2 text-sm font-medium text-gray-600">{a.subtitle}</p>
            <Link
              href={a.href || "#"}
              className="mt-5 inline-flex rounded-xl bg-[#1e375a] px-4 py-2 text-sm font-black text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#162c49]"
            >
              Meer info
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
