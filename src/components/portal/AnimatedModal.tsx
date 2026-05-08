"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export function AnimatedModal({
  closeHref,
  title,
  subtitle,
  children,
}: {
  closeHref: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const closeWithAnimation = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => router.push(closeHref), 190);
  }, [router, closeHref]);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setVisible(true), 10);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeWithAnimation();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, closeWithAnimation]);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[140] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}>
      <button
        type="button"
        aria-label="Sluit popup"
        onClick={closeWithAnimation}
        className="absolute inset-0 bg-black/55"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-7xl rounded-2xl border border-[#b9c9dd] bg-[#eef7ff] p-6 shadow-2xl transition-all duration-200 ${
            visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
          }`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#1e375a]">{title}</h2>
              {subtitle ? <p className="mt-1 text-xs font-bold text-[#365579]">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={closeWithAnimation}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-black text-gray-700"
            >
              Sluiten
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
