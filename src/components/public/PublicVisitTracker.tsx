"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PublicVisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}
