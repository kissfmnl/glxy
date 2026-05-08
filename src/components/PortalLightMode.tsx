"use client";

import { useEffect } from "react";

/** Demo portal stays in dark neon (matches GLXY public). */
export function PortalLightMode() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return null;
}
