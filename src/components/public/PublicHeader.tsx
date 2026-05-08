"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GlxyWordmark } from "@/components/public/GlxyWordmark";

export function PublicHeader({
  instagramUrl,
  tiktokUrl,
  navItems,
}: {
  instagramUrl: string;
  tiktokUrl: string;
  navItems: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const openMenu = () => {
    setMenuClosing(false);
    setMenuVisible(true);
  };

  const closeMenu = useCallback(() => {
    if (!menuVisible) return;
    setMenuClosing(true);
    window.setTimeout(() => {
      setMenuVisible(false);
      setMenuClosing(false);
    }, 260);
  }, [menuVisible]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMenu]);

  return (
    <>
      <header
        className="kiss-public-site-header fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#070a14]/92 backdrop-blur-md"
      >
        <div className="relative mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6 md:h-[4.5rem] md:gap-4 md:px-8">
          <Link
            href="/"
            className="kiss-public-nav-logo relative z-[1] ml-3 flex min-w-0 shrink-0 touch-manipulation items-center outline-none md:ml-0"
          >
            <GlxyWordmark className="text-lg sm:text-xl md:text-2xl" />
          </Link>

          <nav
            className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex lg:items-center lg:justify-center lg:gap-1 xl:gap-1.5"
            aria-label="Hoofdmenu"
          >
            <div className="pointer-events-auto flex items-center gap-1 xl:gap-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`kiss-public-nav-link inline-flex touch-manipulation items-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-black outline-none ${
                    isActive(item.href)
                      ? "border border-cyan-400/40 bg-white/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
                      : "border border-transparent text-white/90 hover:text-cyan-100"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="relative z-[1] flex shrink-0 items-center justify-end gap-2">
            <div className="hidden items-center gap-2 pr-1 lg:flex">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="kiss-public-nav-link kiss-public-social-icon flex h-10 w-10 items-center justify-center rounded-xl text-white/90"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2zm0 1.9A3.3 3.3 0 0 0 3.9 7.2v9.6a3.3 3.3 0 0 0 3.3 3.3h9.6a3.3 3.3 0 0 0 3.3-3.3V7.2a3.3 3.3 0 0 0-3.3-3.3H7.2zm10.1 1.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z" />
                </svg>
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="kiss-public-nav-link kiss-public-social-icon flex h-10 w-10 items-center justify-center rounded-xl text-white/90"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M21 8.09a6.93 6.93 0 0 1-4.06-1.31v9.62a6.94 6.94 0 1 1-6.93-6.93c.14 0 .28.01.41.03v3.82a3.08 3.08 0 1 0 2.07 2.9V2h3.73a6.93 6.93 0 0 0 4.78 6.09z" />
                </svg>
              </a>
            </div>
            <button
              type="button"
              className="kiss-public-nav-link flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl outline-none transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Menu"
              onClick={openMenu}
            >
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuVisible && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${
              menuClosing ? "kiss-mobile-menu-overlay-out" : "kiss-mobile-menu-overlay"
            }`}
            aria-label="Sluit menu"
            onClick={closeMenu}
          />
          <div
            className={`absolute right-0 top-0 flex h-full w-[min(92vw,22rem)] flex-col border-l border-white/10 shadow-2xl ${
              menuClosing ? "kiss-mobile-menu-panel-out" : "kiss-mobile-menu-panel"
            }`}
            style={{ backgroundColor: "var(--glxy-panel-bg, #0a0f1f)" }}
            data-kiss-mobile-menu
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
              <GlxyWordmark className="text-xl" />
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 text-white outline-none transition-colors hover:bg-white/10 touch-manipulation"
                aria-label="Sluit"
                onClick={closeMenu}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center rounded-2xl border px-4 py-3.5 font-black transition-[background-color,border-color] duration-150 ${
                    isActive(item.href)
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                      : "border-white/10 bg-white/5 text-white active:bg-white/10"
                  }`}
                >
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="kiss-mobile-menu-socials grid grid-cols-2 gap-2 border-t border-white/10 px-5 pb-5 pt-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="kiss-public-social-icon inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-3 text-sm font-black text-white transition-[transform,background-color] duration-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2zm0 1.9A3.3 3.3 0 0 0 3.9 7.2v9.6a3.3 3.3 0 0 0 3.3 3.3h9.6a3.3 3.3 0 0 0 3.3-3.3V7.2a3.3 3.3 0 0 0-3.3-3.3H7.2zm10.1 1.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z" />
                </svg>
                Instagram
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="kiss-public-social-icon inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-3 text-sm font-black text-white transition-[transform,background-color] duration-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M21 8.09a6.93 6.93 0 0 1-4.06-1.31v9.62a6.94 6.94 0 1 1-6.93-6.93c.14 0 .28.01.41.03v3.82a3.08 3.08 0 1 0 2.07 2.9V2h3.73a6.93 6.93 0 0 0 4.78 6.09z" />
                </svg>
                TikTok
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
