"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

const NAV_ADMIN: Nav[] = [
  { href: "/admin", label: "Gebruikers (demo)" },
  { href: "/admin/djs", label: "Hosts (demo)" },
  { href: "/admin/programmering", label: "Planner (demo)" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <p className="px-4 pt-4 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{title}</p>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              active(item.href)
                ? "bg-[#00f0ff]/15 text-[#00f0ff] ring-1 ring-[#00f0ff]/30"
                : "text-white/70 hover:bg-white/5 hover:text-white"
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
        className={`fixed left-3 top-3 z-[70] flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/70 text-white shadow-lg backdrop-blur lg:hidden ${mobileOpen ? "hidden" : ""}`}
        aria-label="Open menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen ? (
        <button type="button" className="fixed inset-0 z-[48] bg-black/70 backdrop-blur-sm lg:hidden" aria-label="Close" onClick={() => setMobileOpen(false)} />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-[50] flex h-screen w-64 flex-col overflow-y-auto border-r border-white/10 bg-[#070b14]/95 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <Link href="/dashboard" className="font-black tracking-tight text-white" onClick={() => setMobileOpen(false)}>
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#a855f7] bg-clip-text text-lg text-transparent">GLXY</span>
            <span className="ml-1 text-xs font-black uppercase tracking-[0.2em] text-white/50">Radio</span>
          </Link>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-2 py-1 text-xs font-black text-white/80 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 py-4">
          {section("Workspace", NAV_MAIN)}
          {section("Instellingen", NAV_SETTINGS)}
          {section("Admin demo", NAV_ADMIN)}
        </div>

        <div className="border-t border-white/10 p-4">
          <p className="text-[11px] font-semibold leading-relaxed text-white/45">Static UI-demo · geen database</p>
          <Link href="/" className="mt-2 inline-flex text-xs font-black text-[#00f0ff] hover:underline" onClick={() => setMobileOpen(false)}>
            Naar GLXY.live site
          </Link>
        </div>
      </aside>
    </>
  );
}
