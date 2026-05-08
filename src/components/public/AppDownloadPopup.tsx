"use client";

import { useEffect, useState } from "react";

export function AppDownloadPopup({
  enabled,
  title,
  body,
  cta,
  href,
}: {
  enabled: boolean;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  const SEEN_KEY = "kiss_app_popup_seen_v1";
  const COOKIE_OK_KEY = "kiss_cookie_notice_ok";
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let timeoutId: number | null = null;
    let intervalId: number | null = null;

    const openPopup = (delayMs: number) => {
      timeoutId = window.setTimeout(() => {
        setVisible(true);
        try {
          window.localStorage.setItem(SEEN_KEY, "1");
        } catch {}
      }, delayMs);
    };

    try {
      if (window.localStorage.getItem(SEEN_KEY) === "1") return;
      if (window.localStorage.getItem(COOKIE_OK_KEY) === "1") {
        openPopup(1200);
        return () => {
          if (timeoutId) window.clearTimeout(timeoutId);
        };
      }
    } catch {}

    // Wait until cookie notice has been accepted, then show app popup.
    intervalId = window.setInterval(() => {
      try {
        if (window.localStorage.getItem(COOKIE_OK_KEY) !== "1") return;
      } catch {
        return;
      }
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      openPopup(1200);
    }, 400);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [enabled]);
  if (!enabled || !visible) return null;
  return (
    <aside className={`fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-3 z-[57] w-[min(92vw,330px)] rounded-2xl border border-[#1e375a]/18 bg-white p-4 shadow-[0_16px_36px_rgba(16,37,63,0.22)] md:bottom-[calc(6.25rem+env(safe-area-inset-bottom))] ${closing ? "kiss-float-out" : "kiss-float-in"}`}>
      <button
        type="button"
        aria-label="Sluit app popup"
        className="absolute right-2 top-2 h-7 w-7 rounded-full text-gray-500 hover:bg-gray-100"
        onClick={() => {
          setClosing(true);
          window.setTimeout(() => {
            setVisible(false);
            setClosing(false);
          }, 180);
        }}
      >
        ×
      </button>
      <p className="pr-7 text-sm font-black text-[#1e375a]">{title}</p>
      <p className="mt-1 text-xs font-medium text-gray-600">{body}</p>
      <a
        href={href || "/frequenties"}
        className="mt-3 inline-flex h-9 items-center rounded-full bg-[#37bfbf] px-4 text-xs font-black text-[#0f2c45] transition hover:opacity-90"
      >
        {cta || "Download app"}
      </a>
    </aside>
  );
}
