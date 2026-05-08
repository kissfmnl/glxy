"use client";

import { useEffect } from "react";

export function PublicTabTitle({ title }: { title: string }) {
  useEffect(() => {
    const t = String(title || "").trim();
    if (!t) return;
    document.title = t;
  }, [title]);
  return null;
}
