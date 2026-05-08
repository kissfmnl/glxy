"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function AdminSaveToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const keys = ["saved", "updated", "deleted", "ok", "success"];
    const shouldShow = keys.some((k) => searchParams.get(k) === "1");
    if (!shouldShow) return;
    setVisible(true);
    const url = new URL(window.location.href);
    keys.forEach((k) => url.searchParams.delete(k));
    router.replace(`${pathname}${url.search}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[90] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-emerald-900">Wijziging opgeslagen.</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-black text-emerald-900 transition-all duration-200 ease-out hover:bg-emerald-100"
          >
            Undo
          </button>
          <button
            onClick={() => setVisible(false)}
            className="rounded-lg px-2 py-1 text-xs font-black text-emerald-900 transition-all duration-200 ease-out hover:bg-emerald-100"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
