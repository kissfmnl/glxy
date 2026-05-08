"use client";

import { useEffect } from "react";

// Force public site to LIGHT appearance to avoid device-specific dark-mode mismatch.
export function PublicThemeGuard() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", "light");
    } catch {}
  }, []);
  return null;
}

