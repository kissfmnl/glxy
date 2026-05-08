"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import AppImage from "@/components/AppImage";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function logoSrc() {
  return `/api/assets/Website/Logo/${encodeURIComponent("KISS WITTE LETTERS TRANSPARANT (Edited).png")}`;
}

export function PublicHeader({
  initialInstagramUrl,
  initialWhatsAppUrl,
  navItems,
}: {
  initialInstagramUrl: string;
  initialWhatsAppUrl: string;
  navItems: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const { data: linksData } = useSWR("/api/public-links", fetcher, { fallbackData: { instagramUrl: initialInstagramUrl, whatsAppUrl: initialWhatsAppUrl } });
  const instagramUrl = linksData?.instagramUrl || initialInstagramUrl;
  const whatsAppUrl = linksData?.whatsAppUrl || initialWhatsAppUrl;

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
        className="kiss-public-site-header fixed left-0 right-0 top-0 z-50 border-b bg-[#1e375a]"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="relative mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6 md:h-[4.5rem] md:gap-4 md:px-8">
          <Link
            href="/"
            className="kiss-public-nav-logo relative z-[1] flex min-w-0 shrink-0 items-center touch-manipulation outline-none md:ml-0 ml-3"
          >
            <AppImage
              src={logoSrc()}
              alt="KISS FM"
              className="h-6 w-auto max-w-[120px] object-contain object-left sm:max-w-[132px] md:h-10"
              draggable={false}
            />
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
                  className={`kiss-public-nav-link inline-flex items-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-black touch-manipulation outline-none ${
                    isActive(item.href)
                      ? "kiss-public-nav-link--active border border-[#37bfbf]/45 bg-[#1a3550] text-[#37bfbf]"
                      : "border border-transparent text-white/90"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="relative z-[1] flex shrink-0 items-center justify-end gap-2">
            <div className="hidden lg:flex items-center gap-2 pr-1">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="kiss-public-nav-link kiss-public-social-icon w-10 h-10 rounded-xl text-white/90 flex items-center justify-center"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2zm0 1.9A3.3 3.3 0 0 0 3.9 7.2v9.6a3.3 3.3 0 0 0 3.3 3.3h9.6a3.3 3.3 0 0 0 3.3-3.3V7.2a3.3 3.3 0 0 0-3.3-3.3H7.2zm10.1 1.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z" />
                </svg>
              </a>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="kiss-public-nav-link kiss-public-social-icon w-10 h-10 rounded-xl text-white/90 flex items-center justify-center"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2.02c-5.51 0-9.98 4.43-9.98 9.89 0 1.75.47 3.47 1.37 4.99L2 22l5.26-1.37a10 10 0 0 0 4.78 1.21h.01c5.51 0 9.98-4.43 9.98-9.89S17.56 2.02 12.04 2.02zm0 18.03h-.01a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-3.12.81.84-3.03-.2-.31a8.13 8.13 0 0 1-1.27-4.27c0-4.47 3.68-8.11 8.3-8.11 4.58 0 8.3 3.63 8.3 8.11s-3.72 8.14-8.3 8.14zm4.55-5.99c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.56.12-.17.24-.64.8-.79.97-.14.16-.3.18-.55.06-.25-.12-1.06-.39-2.03-1.24-.75-.66-1.27-1.48-1.41-1.72-.15-.24-.02-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.34-.77-1.84-.2-.47-.4-.41-.56-.42h-.48c-.16 0-.42.06-.65.3-.22.24-.85.82-.85 2.01s.87 2.34.99 2.5c.12.16 1.7 2.58 4.11 3.61.57.24 1.02.38 1.37.48.57.18 1.09.15 1.5.09.46-.07 1.47-.6 1.68-1.17.21-.57.21-1.07.15-1.17-.06-.1-.22-.16-.47-.28z" />
                </svg>
              </a>
            </div>
            <button
              type="button"
              className="lg:hidden kiss-public-nav-link w-11 h-11 rounded-xl flex items-center justify-center touch-manipulation outline-none shrink-0 transition-colors hover:bg-white/10"
              aria-label="Menu"
              onClick={openMenu}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className={`absolute right-0 top-0 h-full w-[min(92vw,22rem)] flex flex-col border-l border-white/10 shadow-2xl ${
              menuClosing ? "kiss-mobile-menu-panel-out" : "kiss-mobile-menu-panel"
            }`}
            style={{ backgroundColor: "var(--brand-navy)" }}
            data-kiss-mobile-menu
          >
            <div className="p-5 flex items-center justify-between gap-3 border-b border-white/10">
              <AppImage src={logoSrc()} alt="KISS FM" className="h-9 w-auto object-contain object-left max-w-[180px]" draggable={false} />
              <button
                type="button"
                className="w-11 h-11 rounded-2xl border border-white/15 flex items-center justify-center text-white touch-manipulation outline-none hover:bg-white/10 transition-colors"
                aria-label="Sluit"
                onClick={closeMenu}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center px-4 py-3.5 rounded-2xl font-black border transition-[background-color,border-color] duration-150 ${
                    isActive(item.href)
                      ? "text-[#37bfbf] border-[#37bfbf]/40 bg-[#37bfbf]/10"
                      : "text-white border-white/10 bg-white/5 active:bg-white/10"
                  }`}
                >
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="kiss-mobile-menu-socials px-5 pb-5 pt-2 grid grid-cols-2 gap-2 border-t border-white/10">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="kiss-public-social-icon inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-3 font-black text-sm text-white transition-[transform,background-color] duration-200"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                  <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2zm0 1.9A3.3 3.3 0 0 0 3.9 7.2v9.6a3.3 3.3 0 0 0 3.3 3.3h9.6a3.3 3.3 0 0 0 3.3-3.3V7.2a3.3 3.3 0 0 0-3.3-3.3H7.2zm10.1 1.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z" />
                </svg>
                Instagram
              </a>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="kiss-public-social-icon inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-3 font-black text-sm text-white transition-[transform,background-color] duration-200"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2.02c-5.51 0-9.98 4.43-9.98 9.89 0 1.75.47 3.47 1.37 4.99L2 22l5.26-1.37a10 10 0 0 0 4.78 1.21h.01c5.51 0 9.98-4.43 9.98-9.89S17.56 2.02 12.04 2.02zm0 18.03h-.01a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-3.12.81.84-3.03-.2-.31a8.13 8.13 0 0 1-1.27-4.27c0-4.47 3.68-8.11 8.3-8.11 4.58 0 8.3 3.63 8.3 8.11s-3.72 8.14-8.3 8.14z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
