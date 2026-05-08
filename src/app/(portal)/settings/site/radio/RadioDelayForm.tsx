"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettings } from "@/app/actions/siteSettingsActions";

export function RadioDelayForm() {
  const [siteStatus, setSiteStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  const [siteLoading, setSiteLoading] = useState(false);
  const [nowPlayingDelaySeconds, setNowPlayingDelaySeconds] = useState(30);

  async function loadSiteSettings() {
    try {
      const result = await getSiteSettings();
      setNowPlayingDelaySeconds(result.nowPlayingDelaySeconds);
    } catch {
      setSiteStatus({ error: "Kon instellingen niet laden." });
    }
  }

  useEffect(() => {
    void loadSiteSettings();
  }, []);

  async function handleSiteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSiteLoading(true);
    setSiteStatus(null);
    try {
      const formData = new FormData();
      formData.set("nowPlayingDelaySeconds", String(nowPlayingDelaySeconds));
      const result = await updateSiteSettings(formData);
      if (result.success) setSiteStatus({ success: true });
      else setSiteStatus({ error: "Opslaan mislukt." });
    } catch {
      setSiteStatus({ error: "Opslaan mislukt." });
    } finally {
      setSiteLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <form onSubmit={handleSiteSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
            Vertraging bij wissel nummer (seconden)
          </label>
          <input
            type="number"
            min={0}
            max={300}
            value={nowPlayingDelaySeconds}
            onChange={(e) => setNowPlayingDelaySeconds(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-shadow focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white md:w-60"
          />
          <p className="mt-2 text-[11px] text-gray-500 dark:text-white/55">
            Korte pauze voordat &quot;Nu speelt&quot; en de playlist naar een nieuw nummer springen, zodat stream en website
            beter synchroon lopen.
          </p>
        </div>

        {siteStatus?.success && (
          <p className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm font-bold text-green-600 dark:text-green-400">
            Opgeslagen.
          </p>
        )}
        {siteStatus?.error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-600 dark:text-red-400">
            {siteStatus.error}
          </p>
        )}

        <button
          type="submit"
          disabled={siteLoading}
          className="rounded-2xl bg-brand-primary px-6 py-3 font-black text-white shadow-lg shadow-brand-primary/20 transition-opacity hover:opacity-95 disabled:opacity-50"
        >
          {siteLoading ? "Opslaan..." : "Opslaan"}
        </button>
      </form>
    </div>
  );
}
