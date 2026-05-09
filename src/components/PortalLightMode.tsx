"use client";

import { useEffect } from "react";

/** Portal should default to light UI (public site has its own theme). */
export function PortalLightMode() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return null;
}
