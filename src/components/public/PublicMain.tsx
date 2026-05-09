"use client";

import { usePathname } from "next/navigation";

/**
 * Content-wrapper padding matcht de vaste header: op de homepage is de logo-rij op desktop verborgen,
 * dus minder top-padding op large breakpoints.
 */
export function PublicMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className={
        isHome
          ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden pt-16 lg:pt-[3.65rem]"
          : "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden pt-16 lg:pt-[6.75rem]"
      }
    >
      {children}
    </div>
  );
}
