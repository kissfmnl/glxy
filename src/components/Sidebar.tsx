"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { isPortalAdmin, isSuperAdmin } from "@/lib/authRoles";

type Nav = { href: string; label: string };

const NAV_MAIN: Nav[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/studio-beta", label: "Studio (demo)" },
  { href: "/dashboard/mijn-profiel", label: "Mijn profiel" },
];

const NAV_SETTINGS: Nav[] = [
  { href: "/settings", label: "Instellingen" },
  { href: "/settings/site", label: "Site" },
  { href: "/settings/programmering", label: "Programmering" },
  { href: "/settings/concerten", label: "Concerten" },
  { href: "/settings/kiss40", label: "GLXY40" },
];

const NAV_ADMIN_STATIONS: Nav[] = [
  { href: "/admin/stations", label: "Zenders & streams" },
  { href: "/admin/player-ui", label: "Player & weergave" },
];

const NAV_ADMIN_DEMO: Nav[] = [
  { href: "/admin/gebruikers", label: "Gebruikers & uitnodigingen" },
  { href: "/admin/branding", label: "Huisstijl (GLXY)" },
  { href: "/admin/media", label: "Mediabibliotheek" },
  { href: "/admin/djs", label: "Hosts (demo)" },
  { href: "/admin/programmering", label: "Planner (demo)" },
  { href: "/admin/acties", label: "Acties (demo)" },
];

const NAV_SUPER: Nav[] = [{ href: "/admin/portal-teksten", label: "Portalteksten" }];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const canAdmin = isPortalAdmin(session?.user?.role);
  const canSuper = isSuperAdmin(session?.user?.role);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  function active(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function section(title: string, items: Nav[]) {
    return (
      <div className="space-y-1 px-3">
        <p className="px-4 pb-1 pt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{title}</p>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
              active(item.href)
                ? "bg-white/20 text-white shadow-inner ring-1 ring-white/30"
                : "text-white/92 hover:bg-black/25 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`fixed left-3 top-3 z-[70] flex h-11 w-11 items-center justify-center rounded-xl border border-[#0b7557]/40 bg-white text-[#0b7557] shadow-lg lg:hidden ${mobileOpen ? "hidden" : ""}`}
        aria-label="Open menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[48] bg-black/35 backdrop-blur-sm lg:hidden"
          aria-label="Close"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-[50] flex h-screen w-64 flex-col overflow-y-auto border-r border-white/15 bg-[#0b7557] text-white shadow-[6px_0_32px_rgba(0,0,0,0.18)] transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/15 bg-black/10 px-4 py-4">
          <Link href="/dashboard" className="font-black tracking-tight text-white" onClick={() => setMobileOpen(false)}>
            <span className="text-lg">GLXY</span>
            <span className="ml-1 text-xs font-black uppercase tracking-[0.2em] text-white/90">Radio</span>
          </Link>
          <button
            type="button"
            className="rounded-lg border border-white/35 bg-white/10 px-2 py-1 text-xs font-black text-white hover:bg-white/20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 py-4">
          {section("Workspace", NAV_MAIN)}
          {section("Instellingen", NAV_SETTINGS)}
          {canAdmin ? section("Zenders", NAV_ADMIN_STATIONS) : null}
          {canAdmin ? section("Beheer", NAV_ADMIN_DEMO) : null}
          {canSuper ? section("Super-admin", NAV_SUPER) : null}
        </div>

        <div className="space-y-3 border-t border-white/15 p-4">
          {status === "authenticated" ? (
            <div className="space-y-1">
              <p className="truncate text-[11px] font-black text-white" title={session?.user?.email ?? ""}>
                {session?.user?.email}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65">{session?.user?.role ?? ""}</p>
              <button
                type="button"
                className="mt-2 w-full rounded-xl border border-white/30 bg-white py-2 text-xs font-black text-[#0b7557] hover:bg-white/95"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Uitloggen
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl border border-white/25 bg-white/15 py-2.5 text-xs font-black text-white hover:bg-white/25"
              onClick={() => setMobileOpen(false)}
            >
              Inloggen
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex text-xs font-black text-white/95 underline-offset-2 hover:underline"
            onClick={() => setMobileOpen(false)}
          >
            Naar GLXY.live site
          </Link>
        </div>
      </aside>
    </>
  );
}
