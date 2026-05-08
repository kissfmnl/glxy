"use client";

import { useEffect } from "react";

/** Admin draait altijd licht: geen dark class op <html> binnen het portaal. */
export function PortalLightMode() {
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    document.documentElement.classList.remove("dark");
    return () => {
      if (saved === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
  }, []);
  return null;
}
