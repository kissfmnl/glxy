import type { ReactNode } from "react";

/** Eenvoudige contentpagina voor GLXY (statische tekst, één kolom). */
export function PublicSimplePage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-12">
      <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[var(--brand-primary)]">GLXY Radio</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
      {intro ? (
        <p className="mt-4 text-base font-semibold leading-relaxed text-white/75 md:text-lg">{intro}</p>
      ) : null}
      {children ? <div className="mt-8 space-y-4 text-sm font-medium leading-relaxed text-white/80">{children}</div> : null}
    </div>
  );
}
