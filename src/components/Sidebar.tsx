"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { normalizePortalPermissions, type PortalPermissionKey } from "@/lib/portalPermissions";
import AppImage from "@/components/AppImage";
export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = String((session?.user as any)?.role || "");
  const isAdmin = role === "ADMIN";
  const kiss40Editor = Boolean((session?.user as any)?.kiss40Editor);
  const perms = normalizePortalPermissions((session?.user as any)?.portalPermissions);
  const can = (key: PortalPermissionKey) => perms.includes(key);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSiteSettingsPath =
    pathname === "/settings/site" ||
    pathname.startsWith("/settings/site/") ||
    pathname.startsWith("/settings/website-teksten") ||
    pathname.startsWith("/settings/home-hero-planning") ||
    pathname.startsWith("/settings/join-kiss") ||
    pathname.startsWith("/settings/homepage-wave") ||
    pathname.startsWith("/settings/homepage-collage") ||
    pathname.startsWith("/settings/frequenties-badges") ||
    pathname.startsWith("/settings/favicon") ||
    pathname.startsWith("/settings/programmering") ||
    pathname.startsWith("/settings/concerten") ||
    pathname.startsWith("/settings/homepage");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg
          width={20}
          height={20}
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/studio-beta",
      label: "Studio reservering 2.0",
      badge: "BETA IN ONTWIKKELING",
      hidden: !can("studioBeta"),
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  if (isAdmin) {
    if (can("manageUsers")) navItems.push({
      href: "/admin",
      label: "Gebruikers",
      icon: (
        <svg
          width={20}
          height={20}
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    });
    if (can("manageDjs")) navItems.push({
      href: "/admin/djs",
      label: "DJ's",
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });
    if (kiss40Editor && can("manageKiss40")) {
      navItems.push({
        href: "/settings/kiss40",
        label: "KISS40",
        icon: (
          <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        ),
      });
    }
    if (can("manageStudioLegacy")) navItems.push({
      href: "/admin/studio",
      label: "Studio reservering",
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    });
    if (can("manageSiteSettings")) navItems.push({
      href: "/settings/site",
      label: "Site instellingen",
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
          />
        </svg>
      ),
    });
    if (can("manageDeveloper")) navItems.push({
      href: "/settings/developer",
      label: "Developer",
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    });
    if (can("manageFiles")) navItems.push({
      href: "/settings/bestanden",
      label: "Bestanden",
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
      ),
    });
    if (can("manageVisitors")) navItems.push({
      href: "/settings/bezoekers",
      label: "Bezoekers",
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0V10a2 2 0 00-2-2H9a2 2 0 00-2 2v10m10 0H7" />
        </svg>
      ),
    });
    if (can("managePlaylistVotes")) navItems.push({
      href: "/admin/inzendingen?tab=playlist",
      label: "Inzendingen & stemmen",
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a2 2 0 10-4 0v10a4 4 0 104 0V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9h4" />
        </svg>
      ),
    });
  }

  if (can("editOwnJockProfile")) {
    navItems.push({
      href: "/dashboard/mijn-profiel",
      label: "Mijn DJ-profiel",
      icon: (
        <svg width={20} height={20} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`fixed left-3 top-3 z-[70] h-11 w-11 items-center justify-center rounded-xl border shadow-md transition-colors lg:hidden ${mobileOpen ? "hidden" : "flex"}`}
        style={{ backgroundColor: "var(--bg-sidebar)", borderColor: "var(--border-color)" }}
        aria-expanded={mobileOpen}
        aria-controls="portal-sidebar-nav"
        aria-label="Open menu"
      >
        <svg className="h-6 w-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[48] bg-black/40 lg:hidden"
          aria-label="Menu sluiten"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        id="portal-sidebar-nav"
        className={`fixed left-0 top-0 z-[50] flex h-screen w-64 max-w-[min(100%,18rem)] flex-col overflow-hidden border-r transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ backgroundColor: "var(--bg-sidebar)", borderColor: "var(--border-color)" }}
      >
      {/* Logo — zelfde wordmark als publieke site; navy strook zodat wit logo leesbaar blijft */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#1e375a] px-4 py-4 sm:px-5 sm:py-5">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <AppImage
            src={`/api/assets/Website/Logo/${encodeURIComponent("KISS WITTE LETTERS TRANSPARANT (Edited).png")}`}
            alt="KISS FM"
            className="h-8 w-auto max-w-[min(100%,200px)] object-contain object-left sm:h-9"
          />
        </Link>
        <span className="hidden shrink-0 text-[9px] font-black uppercase leading-tight tracking-widest text-white/45 sm:inline sm:max-w-[4.5rem] sm:text-right">
          Portaal
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 text-white lg:hidden"
          aria-label="Sluit menu"
        >
          ✕
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.filter((item) => !(item as any).hidden).map((item) => {
          const isSiteSettingsHub = item.href === "/settings/site" && isSiteSettingsPath;
          const isDashboardRoot = item.href === "/dashboard" ? pathname === "/dashboard" : false;
          const isActive = isSiteSettingsHub
            ? true
            : isDashboardRoot || pathname === item.href || (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.icon}
              <span className="min-w-0">
                <span className="block">{item.label}</span>
                {(item as any).badge ? (
                  <span className={`block text-[9px] font-black tracking-wider ${(isActive ? "text-white/80" : "text-amber-600")}`}>
                    {(item as any).badge}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer & Toggle */}
      <div className="px-3 py-4 border-t transition-colors duration-200"
           style={{ borderColor: 'var(--border-color)' }}>
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={`mb-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
            pathname === "/settings" || (pathname.startsWith("/settings/") && !isSiteSettingsPath)
              ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <svg
            width={20}
            height={20}
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Instellingen
        </Link>

        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-4 py-2 mb-3 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Uitloggen
          </button>
        )}

        <p className="text-gray-400 text-[9px] text-center uppercase tracking-[0.2em] font-black">
          MVP v0.1 — KISS FM
        </p>
      </div>
    </aside>
    </>
  );
}
