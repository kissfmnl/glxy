"use client";

import { usePathname } from "next/navigation";
import { PortalPageShell } from "@/components/portal/PortalPageShell";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/studio-beta": "Studio reservering (demo)",
  "/dashboard/mijn-profiel": "Mijn profiel",
  "/admin": "Administratie · demo",
  "/admin/acties": "Acties · demo",
  "/admin/concerten": "Concerten · demo",
  "/admin/djs": "Hosts · demo",
  "/admin/inzendingen": "Inzendingen · demo",
  "/admin/programmering": "Programmering · demo",
  "/admin/stemmen": "Stemmen · demo",
  "/admin/studio": "Studio · demo",
  "/admin/teksten": "Teksten · demo",
  "/admin/home-hero-planning": "Hero-planning · demo",
  "/settings": "Instellingen",
  "/settings/backup": "Backup · demo",
  "/settings/bestanden": "Bestanden · demo",
  "/settings/bezoekers": "Bezoekers · demo",
  "/settings/concerten": "Concerten · demo",
  "/settings/developer": "Developer · demo",
  "/settings/favicon": "Favicon · demo",
  "/settings/frequenties-badges": "Frequenties · demo",
  "/settings/home-hero-planning": "Hero-planning · demo",
  "/settings/homepage": "Homepage · demo",
  "/settings/homepage-collage": "Homepage-collage · demo",
  "/settings/homepage-wave": "Homepage-wave · demo",
  "/settings/join-kiss": "Word host · demo",
  "/settings/kiss40": "GLXY40 · demo",
  "/settings/programmering": "Programmering · demo",
  "/settings/site": "Site · demo",
  "/settings/site/general": "Site algemeen · demo",
  "/settings/site/radio": "Radio · demo",
  "/settings/website-teksten": "Teksten · demo",
  "/whatsapp": "Berichten · niet actief",
};

export function PortalMockPage() {
  const pathname = usePathname() || "/dashboard";
  const title =
    TITLES[pathname] ??
    (pathname.startsWith("/settings/kiss40/") ? "GLXY40 track · demo" : `Portal · ${pathname}`);

  return (
    <PortalPageShell width="wide" className="space-y-6">
      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--brand-primary)]/80">GLXY Radio · portaal</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--text-main)] md:text-3xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[var(--text-muted)]">
          Deze pagina is nog in aanbouw. De onderdelen die al werken vind je in het menu (bijv. Huisstijl, Mediabibliotheek, Gebruikers).
        </p>
      </div>
    </PortalPageShell>
  );
}
