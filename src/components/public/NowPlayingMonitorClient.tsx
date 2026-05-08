"use client";

import { useEffect, useMemo, useState } from "react";
import { MOCK_NOW_PLAYING_PAYLOAD, MOCK_RECENT_TRACKS_PAYLOAD } from "@/lib/mock/site";

type NowPlayingResponse = {
  success?: boolean;
  current?: { title?: string; artist?: string; startTime?: string; duration?: number };
  next?: { title?: string; artist?: string };
  updated?: string;
  cover?: string | null;
  error?: string;
};

type RecentTrack = {
  id: string;
  artist: string;
  title: string;
  cover: string | null;
  playedAt: string;
};

const GAP_THRESHOLD_MINUTES = 8;

function fmtTime(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("nl-NL");
}

/** Studio-monitor: toont vaste demo-data (geen API). */
export default function NowPlayingMonitorClient() {
  const [data, setData] = useState<NowPlayingResponse | null>(null);
  const [tracks, setTracks] = useState<RecentTrack[]>([]);
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());

  useEffect(() => {
    const base: NowPlayingResponse = {
      ...MOCK_NOW_PLAYING_PAYLOAD,
      success: true,
      updated: new Date().toISOString(),
    };
    setData(base);
    setTracks(MOCK_RECENT_TRACKS_PAYLOAD.tracks.slice(0, 14));
    setLastTickAt(Date.now());
    const t = setInterval(() => {
      setNowTs(Date.now());
      setLastTickAt(Date.now());
      setData((prev) => ({ ...base, ...prev, updated: new Date().toISOString() }));
    }, 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsSincePoll = useMemo(() => {
    if (!lastTickAt) return null;
    return Math.max(0, Math.floor((nowTs - lastTickAt) / 1000));
  }, [lastTickAt, nowTs]);

  const gapAlerts = useMemo(() => {
    const sorted = [...tracks].sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
    const out: Array<{ newer: RecentTrack; older: RecentTrack; gapMinutes: number }> = [];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const newer = sorted[i]!;
      const older = sorted[i + 1]!;
      const gapMs = new Date(newer.playedAt).getTime() - new Date(older.playedAt).getTime();
      const gapMinutes = gapMs / 60000;
      if (gapMinutes > GAP_THRESHOLD_MINUTES) out.push({ newer, older, gapMinutes });
    }
    return out;
  }, [tracks]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#b7c9de] bg-[#1e375a] px-5 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">Timer sinds laatste refresh (demo)</p>
        <p className="mt-1 text-5xl font-black tabular-nums leading-none">
          {secondsSincePoll == null ? "--" : secondsSincePoll}
          <span className="ml-2 text-base font-bold text-white/85">sec</span>
        </p>
      </div>

      <div className="rounded-2xl border border-[#c8d5e6] bg-[#f3f7fc] p-4">
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            <span className="font-black">Status:</span> demo (geen server)
          </p>
          <p>
            <span className="font-black">Interval:</span> elke 15 sec (alleen klok)
          </p>
          <p>
            <span className="font-black">Laatste tick:</span> {fmtTime(lastTickAt)}
          </p>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          gapAlerts.length ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50"
        }`}
      >
        <h2 className="text-lg font-black text-gray-900">Log-overzicht (gatencheck)</h2>
        {gapAlerts.length ? (
          <>
            <p className="mt-1 text-sm font-bold text-red-700">
              Waarschuwing: {gapAlerts.length} gat(en) groter dan {GAP_THRESHOLD_MINUTES} minuten.
            </p>
            <div className="mt-3 max-h-[220px] space-y-2 overflow-auto pr-1">
              {gapAlerts.map((g, idx) => (
                <div key={`${g.newer.id}-${g.older.id}-${idx}`} className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm">
                  <p className="font-black text-red-800">Gat: {g.gapMinutes.toFixed(1)} min</p>
                  <p className="text-gray-700">
                    {new Date(g.newer.playedAt).toLocaleString("nl-NL")} ({g.newer.artist} - {g.newer.title})
                  </p>
                  <p className="text-gray-700">
                    {new Date(g.older.playedAt).toLocaleString("nl-NL")} ({g.older.artist} - {g.older.title})
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm font-bold text-emerald-700">
            Geen gaten groter dan {GAP_THRESHOLD_MINUTES} minuten in de laatste {tracks.length} tracks.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-black text-gray-900">Playlist (mock)</h2>
        {tracks.length ? (
          <div className="max-h-[380px] space-y-2 overflow-auto pr-1">
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-gray-900">
                    {t.artist} - {t.title}
                  </p>
                  <p className="text-xs font-semibold text-gray-600">{new Date(t.playedAt).toLocaleString("nl-NL")}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[#c8d5e6] bg-white px-2 py-0.5 text-[10px] font-black text-[#1e375a]">
                  mock
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Geen tracks.</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-black text-gray-900">Nu / straks (mock)</h2>
        {data ? (
          <div className="space-y-2 text-sm text-gray-800">
            <p>
              <span className="font-black">Nu:</span> {data.current?.artist || "-"} - {data.current?.title || "-"}
            </p>
            <p>
              <span className="font-black">Straks:</span> {data.next?.artist || "-"} - {data.next?.title || "-"}
            </p>
            <p>
              <span className="font-black">Feed updated:</span> {data.updated || "-"}
            </p>
            <p>
              <span className="font-black">Cover:</span> {data.cover || "-"}
            </p>
            <pre className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Laden…</p>
        )}
      </div>
    </div>
  );
}
