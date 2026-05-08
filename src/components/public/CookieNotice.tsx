"use client";

import { useEffect, useState } from "react";

export function CookieNotice({ enabled, text, cta }: { enabled: boolean; text: string; cta: string }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    try {
      if (localStorage.getItem("kiss_cookie_notice_ok") === "1") return;
    } catch {}
    setVisible(true);
  }, [enabled]);

  if (!enabled || !visible) return null;
  return (
    <div className={`fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[58] mx-auto max-w-3xl rounded-2xl border border-[#1e375a]/20 bg-white p-3 shadow-[0_10px_28px_rgba(30,55,90,0.16)] md:bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:p-4 ${closing ? "kiss-float-out" : "kiss-float-in"}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-[#1e375a]">{text}</p>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem("kiss_cookie_notice_ok", "1");
            } catch {}
            setClosing(true);
            window.setTimeout(() => {
              setVisible(false);
              setClosing(false);
            }, 180);
          }}
          className="h-9 rounded-full bg-[#1e375a] px-4 text-xs font-black text-white transition hover:bg-[#16304f]"
        >
          {cta || "Ok"}
        </button>
      </div>
    </div>
  );
}
