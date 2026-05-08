"use client";

import { useEffect, useState } from "react";
import { getTraffic } from "@/app/actions/trafficActions";

export default function TrafficWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTraffic = async () => {
      const result = await getTraffic();
      if (result.success) {
        setData(result);
      }
      setLoading(false);
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 60000); // 1 min refresh

    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="card flex animate-pulse flex-col gap-3 rounded-3xl p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 w-full rounded-xl bg-gray-200 dark:bg-white/10" />
      ))}
    </div>
  );

  if (!data || !data.success) return (
    <div className="card rounded-3xl p-6 text-center text-xs text-gray-500">Verkeersinformatie offline</div>
  );

  return (
    <div className="card flex h-full flex-col overflow-hidden rounded-3xl p-0">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-5 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2 leading-none">
          <span className="inline-flex items-center justify-center w-2 h-2">
            <span
              className={`w-2 h-2 rounded-full ${
                data.isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
          </span>
          <span className="text-[10px] uppercase font-black text-gray-900 dark:text-gray-400 tracking-widest leading-none">
            Actuele files {data.isLive ? "" : "(demo)"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">{data.totalLength} totaal</span>
        </div>
      </div>

      {!data.isLive ? (
        <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold text-center leading-tight">
            Demo verkeersdata actief. Live feed komt automatisch terug zodra ANWB weer beschikbaar is.
          </p>
        </div>
      ) : null}

      {data.isLive && data.feedNote ? (
        <div className="mx-6 mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="text-[10px] text-amber-900/90 dark:text-amber-100/90 font-bold leading-snug">{data.feedNote}</p>
        </div>
      ) : null}

      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto px-6 py-5">
        {data.jams.map((jam: any) => (
          <div
            key={jam.id}
            className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-14 shrink-0 py-1.5 px-1 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-900 dark:text-white border dark:border-white/10 text-center leading-tight">
                {jam.road}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  {jam.to ? `${jam.from} \u2192 ${jam.to}` : jam.from}
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 font-bold mt-1 leading-snug">
                  <span className="text-brand-primary">{jam.length}</span>
                  <span className="text-gray-400 dark:text-gray-500"> · </span>
                  {jam.reason}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-left sm:text-right pl-[68px] sm:pl-0">
              <p className="text-xs font-black text-brand-primary uppercase tracking-tight">{jam.delay}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Vertraging</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
