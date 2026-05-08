"use client";

import { useEffect, useMemo, useState } from "react";

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

type PollFailure = {
  at: number;
  source: "now-playing" | "recent-tracks";
  reason: string;
};

const POLL_MS = 15_000;
const GAP_THRESHOLD_MINUTES = 8;
const MAX_FAILURES = 30;

function fmtTime(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("nl-NL");
}

export default function NowPlayingMonitorClient() {
  const [data, setData] = useState<NowPlayingResponse | null>(null);
  const [tracks, setTracks] = useState<RecentTrack[]>([]);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<number | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [pollFailures, setPollFailures] = useState<PollFailure[]>([]);

  const pushFailure = (source: PollFailure["source"], reason: string) => {
    setPollFailures((prev) => [{ at: Date.now(), source, reason }, ...prev].slice(0, MAX_FAILURES));
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      setIsPolling(true);
      setLastPollAt(Date.now());
      setPollCount((c) => c + 1);
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        let json: NowPlayingResponse | null = null;
        try {
          json = (await res.json()) as NowPlayingResponse;
        } catch {
          json = null;
          pushFailure("now-playing", `JSON parse fout (HTTP ${res.status})`);
        }
        if (cancelled) return;
        if (json) setData(json);
        if (res.ok) {
          setError(null);
          setLastSuccessAt(Date.now());
        } else {
          const reason = `HTTP ${res.status}`;
          setError(reason);
          pushFailure("now-playing", reason);
        }
      } catch (e) {
        if (cancelled) return;
        const reason = e instanceof Error ? e.message : "Onbekende netwerkfout";
        setError(reason);
        pushFailure("now-playing", reason);
      } finally {
        if (!cancelled) setIsPolling(false);
      }
    };

    void poll();
    timer = setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const refreshTracks = async () => {
      try {
        const res = await fetch("/api/recent-tracks?limit=14", { cache: "no-store" });
        let json: { success?: boolean; tracks?: RecentTrack[] } | null = null;
        try {
          json = (await res.json()) as { success?: boolean; tracks?: RecentTrack[] };
        } catch {
          json = null;
          pushFailure("recent-tracks", `JSON parse fout (HTTP ${res.status})`);
        }
        if (cancelled) return;
        if (!res.ok) {
          pushFailure("recent-tracks", `HTTP ${res.status}`);
          return;
        }
        if (Array.isArray(json?.tracks)) {
          setTracks(json.tracks);
          return;
        }
        pushFailure("recent-tracks", "Ongeldige payload (tracks ontbreekt)");
      } catch {
        pushFailure("recent-tracks", "Netwerkfout");
      }
    };
    void refreshTracks();
    timer = setInterval(() => void refreshTracks(), 20_000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  const statusText = useMemo(() => {
    if (error) return "Fout";
    if (!data) return "Nog geen data";
    return "Actief";
  }, [data, error]);

  const secondsSincePoll = useMemo(() => {
    if (!lastPollAt) return null;
    return Math.max(0, Math.floor((nowTs - lastPollAt) / 1000));
  }, [lastPollAt, nowTs]);

  const gapAlerts = useMemo(() => {
    const sorted = [...tracks].sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
    const out: Array<{ newer: RecentTrack; older: RecentTrack; gapMinutes: number }> = [];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const newer = sorted[i];
      const older = sorted[i + 1];
      const gapMs = new Date(newer.playedAt).getTime() - new Date(older.playedAt).getTime();
      const gapMinutes = gapMs / 60000;
      if (gapMinutes > GAP_THRESHOLD_MINUTES) {
        out.push({ newer, older, gapMinutes });
      }
    }
    return out;
  }, [tracks]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#b7c9de] bg-[#1e375a] px-5 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">Timer sinds laatste poll</p>
        <p className="mt-1 text-5xl font-black tabular-nums leading-none">
          {secondsSincePoll == null ? "--" : secondsSincePoll}
          <span className="ml-2 text-base font-bold text-white/85">sec</span>
        </p>
      </div>

      <div className="rounded-2xl border border-[#c8d5e6] bg-[#f3f7fc] p-4">
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p><span className="font-black">Status:</span> {statusText}{isPolling ? " (pollen...)" : ""}</p>
          <p><span className="font-black">Interval:</span> elke {Math.round(POLL_MS / 1000)} sec</p>
          <p><span className="font-black">Laatste poll:</span> {fmtTime(lastPollAt)}</p>
          <p><span className="font-black">Laatste succes:</span> {fmtTime(lastSuccessAt)}</p>
          <p><span className="font-black">Aantal polls:</span> {pollCount}</p>
          <p className={error ? "text-red-700" : ""}><span className="font-black">Laatste fout:</span> {error || "-"}</p>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          gapAlerts.length
            ? "border-red-300 bg-red-50"
            : "border-emerald-300 bg-emerald-50"
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
                  <p className="font-black text-red-800">
                    Gat: {g.gapMinutes.toFixed(1)} min
                  </p>
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
        <h2 className="mb-3 text-lg font-black text-gray-900">Polling foutenlog</h2>
        {pollFailures.length ? (
          <div className="max-h-[280px] space-y-2 overflow-auto pr-1">
            {pollFailures.map((f, idx) => (
              <div key={`${f.at}-${f.source}-${idx}`} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm">
                <p className="font-black text-red-800">{f.source} - {f.reason}</p>
                <p className="text-xs font-semibold text-red-700/90">{new Date(f.at).toLocaleString("nl-NL")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-bold text-emerald-700">Nog geen poll-fouten geregistreerd.</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-black text-gray-900">Playlist logging (laatste tracks)</h2>
        {tracks.length ? (
          <div className="max-h-[380px] space-y-2 overflow-auto pr-1">
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-gray-900">{t.artist} - {t.title}</p>
                  <p className="text-xs font-semibold text-gray-600">{new Date(t.playedAt).toLocaleString("nl-NL")}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[#c8d5e6] bg-white px-2 py-0.5 text-[10px] font-black text-[#1e375a]">
                  gelogd
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Nog geen playlist data gevonden.</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-black text-gray-900">Laatst gepolde info</h2>
        {data ? (
          <div className="space-y-2 text-sm text-gray-800">
            <p><span className="font-black">Nu:</span> {data.current?.artist || "-"} - {data.current?.title || "-"}</p>
            <p><span className="font-black">Straks:</span> {data.next?.artist || "-"} - {data.next?.title || "-"}</p>
            <p><span className="font-black">Feed updated:</span> {data.updated || "-"}</p>
            <p><span className="font-black">Cover:</span> {data.cover || "-"}</p>
            <pre className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Wachten op eerste poll...</p>
        )}
      </div>
    </div>
  );
}
