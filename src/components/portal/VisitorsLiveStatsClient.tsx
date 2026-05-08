"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function VisitorsLiveStatsClient() {
  const { data } = useSWR("/api/admin/live-stats", fetcher, { refreshInterval: 15_000 });
  const activeSiteUsers5m =
    typeof data?.activeSiteUsers5m === "number" ? (data.activeSiteUsers5m as number) : null;
  const streamListeners =
    typeof data?.streamListeners === "number" ? (data.streamListeners as number) : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black text-gray-500">Actief op website (laatste 5 min)</p>
        <p className="mt-1 text-3xl font-black text-[#1e375a]">{activeSiteUsers5m ?? "—"}</p>
        <p className="mt-1 text-[11px] font-bold text-gray-500">Auto update (±15s)</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black text-gray-500">Luisteraars (stream)</p>
        <p className="mt-1 text-3xl font-black text-[#1e375a]">{streamListeners ?? "—"}</p>
        <p className="mt-1 text-[11px] font-bold text-gray-500">
          {streamListeners === null ? "Stream-status niet beschikbaar" : "Auto update (±15s)"}
        </p>
      </div>
    </div>
  );
}

