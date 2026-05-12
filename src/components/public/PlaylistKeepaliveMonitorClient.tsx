"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StationPlayEntry } from "@/lib/stationPlayHistory";

type BatchById = Record<string, { title: string; artist: string; coverUrl: string | null }>;

type JustPlayedPayload = {
  stations: Array<{ id: string; label: string; logoUrl?: string | null }>;
  byStation: Record<string, StationPlayEntry[]>;
  merged: (StationPlayEntry & { stationId: string })[];
};

type PollError = { at: number; message: string };

type MonitorPayload = {
  success: boolean;
  polledAt: string;
  intervalMs: number;
  current: { title: string; artist: string; startTime: string | null; duration: number | null };
  next: { title: string; artist: string } | null;
  updated: string;
  cover: string | null;
  byId: BatchById;
  selectedStationId: string;
};

const GAP_THRESHOLD_MINUTES = 8;
const GAP_TRACK_COUNT = 14;
const DEFAULT_INTERVAL_MS = 15_000;
const MIN_INTERVAL_MS = 5_000;
const MAX_INTERVAL_MS = 120_000;

function fmtNl(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("nl-NL");
}

function buildMonitorPayload(byId: BatchById, selectedStationId: string, intervalMs: number): MonitorPayload {
  const cur = byId[selectedStationId] ?? { title: "", artist: "", coverUrl: null };
  const now = new Date().toISOString();
  return {
    success: true,
    polledAt: now,
    intervalMs,
    current: {
      title: cur.title || "",
      artist: cur.artist || "",
      startTime: null,
      duration: null,
    },
    next: null,
    updated: now,
    cover: cur.coverUrl,
    byId,
    selectedStationId,
  };
}

export function PlaylistKeepaliveMonitorClient({
  stations,
}: {
  stations: Array<{ id: string; label: string }>;
}) {
  const stationIds = useMemo(() => stations.map((s) => s.id), [stations]);
  const idsQuery = stationIds.join(",");
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id ?? "");

  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const [lastPollOkAt, setLastPollOkAt] = useState<number | null>(null);
  const [lastPollAttemptAt, setLastPollAttemptAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [pollErrors, setPollErrors] = useState<PollError[]>([]);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const [batchById, setBatchById] = useState<BatchById>({});
  const [jpPayload, setJpPayload] = useState<JustPlayedPayload | null>(null);

  const pollOnce = useCallback(async () => {
    if (!idsQuery) return;
    const attemptAt = Date.now();
    setLastPollAttemptAt(attemptAt);
    setPollCount((c) => c + 1);
    try {
      const r = await fetch(`/api/stations/now-playing-batch?ids=${encodeURIComponent(idsQuery)}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const msg = `Batch HTTP ${r.status}`;
        setLastError(msg);
        setPollErrors((prev) => [...prev.slice(-49), { at: attemptAt, message: msg }]);
        return;
      }
      const j = (await r.json()) as { byId?: BatchById };
      const byId = j?.byId && typeof j.byId === "object" ? j.byId : {};
      setBatchById(byId);
      setLastPollOkAt(Date.now());
      setLastError(null);

      const jr = await fetch("/api/public/just-played", { cache: "no-store" });
      if (jr.ok) {
        const jj = (await jr.json()) as JustPlayedPayload;
        if (jj && typeof jj === "object") setJpPayload(jj);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Onbekende fout";
      setLastError(msg);
      setPollErrors((prev) => [...prev.slice(-49), { at: attemptAt, message: msg }]);
    }
  }, [idsQuery]);

  useEffect(() => {
    if (!idsQuery) return;
    void pollOnce();
    const t = window.setInterval(() => void pollOnce(), intervalMs);
    return () => window.clearInterval(t);
  }, [idsQuery, intervalMs, pollOnce]);

  useEffect(() => {
    const t = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!selectedStationId && stations[0]) setSelectedStationId(stations[0].id);
  }, [stations, selectedStationId]);

  const secondsSincePoll = useMemo(() => {
    if (!lastPollOkAt) return null;
    return Math.max(0, Math.floor((nowTs - lastPollOkAt) / 1000));
  }, [lastPollOkAt, nowTs]);

  const tracksForGap = useMemo(() => {
    const sid = selectedStationId || stations[0]?.id;
    if (!jpPayload?.byStation || !sid) return [];
    const list = [...(jpPayload.byStation[sid] ?? [])].sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
    );
    return list.slice(0, GAP_TRACK_COUNT).map((e) => ({
      id: e.id,
      artist: e.artist,
      title: e.title,
      playedAt: e.playedAt,
    }));
  }, [jpPayload, selectedStationId, stations]);

  const gapAlerts = useMemo(() => {
    const sorted = [...tracksForGap].sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
    const out: Array<{ newer: (typeof sorted)[0]; older: (typeof sorted)[0]; gapMinutes: number }> = [];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const newer = sorted[i]!;
      const older = sorted[i + 1]!;
      const gapMs = new Date(newer.playedAt).getTime() - new Date(older.playedAt).getTime();
      const gapMinutes = gapMs / 60000;
      if (gapMinutes > GAP_THRESHOLD_MINUTES) out.push({ newer, older, gapMinutes });
    }
    return out;
  }, [tracksForGap]);

  const displayTracks = useMemo(() => {
    const sid = selectedStationId || stations[0]?.id;
    if (!jpPayload?.byStation || !sid) return [];
    return [...(jpPayload.byStation[sid] ?? [])].sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
    );
  }, [jpPayload, selectedStationId, stations]);

  const monitorJson = useMemo(() => {
    const sid = selectedStationId || stations[0]?.id;
    return buildMonitorPayload(batchById, sid || "", intervalMs);
  }, [batchById, selectedStationId, stations, intervalMs]);

  return (
    <div className="space-y-5">
      <p className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
        Laat deze pagina open op de monitor-pc. Hij blijft{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">/api/stations/now-playing-batch</code> pollen zodat
        Just-played logging actief blijft (naast de server-cron).
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm text-gray-200">
          <span className="mb-1 block text-xs font-black uppercase tracking-wide text-white/60">Zender (gatencheck + log)</span>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm font-semibold text-white"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.id})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-200">
          <span className="mb-1 block text-xs font-black uppercase tracking-wide text-white/60">Poll-interval (sec)</span>
          <input
            type="number"
            min={MIN_INTERVAL_MS / 1000}
            max={MAX_INTERVAL_MS / 1000}
            step={1}
            value={Math.round(intervalMs / 1000)}
            onChange={(e) => {
              const s = Number(e.target.value);
              if (!Number.isFinite(s)) return;
              setIntervalMs(Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, Math.round(s * 1000))));
            }}
            className="w-24 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm font-mono text-white"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-cyan-500/25 bg-[#0f172a] px-5 py-4 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200/80">Timer sinds laatste succesvolle poll</p>
        <p className="mt-1 text-5xl font-black tabular-nums leading-none text-white">
          {secondsSincePoll == null ? "--" : secondsSincePoll}
          <span className="ml-2 text-base font-bold text-white/75">sec</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
        <div className="grid gap-2 text-sm text-gray-100 md:grid-cols-2">
          <p>
            <span className="font-black text-white">Status:</span>{" "}
            {lastPollOkAt ? <span className="text-emerald-300">Actief</span> : <span className="text-amber-300">Wacht op eerste poll…</span>}
          </p>
          <p>
            <span className="font-black text-white">Interval:</span> elke {intervalMs / 1000} sec
          </p>
          <p>
            <span className="font-black text-white">Laatste poll (poging):</span> {fmtNl(lastPollAttemptAt)}
          </p>
          <p>
            <span className="font-black text-white">Laatste succes:</span> {fmtNl(lastPollOkAt)}
          </p>
          <p>
            <span className="font-black text-white">Aantal polls:</span> {pollCount}
          </p>
          <p>
            <span className="font-black text-white">Laatste fout:</span> {lastError ?? "-"}
          </p>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          gapAlerts.length ? "border-red-400/40 bg-red-950/35" : "border-emerald-500/30 bg-emerald-950/25"
        }`}
      >
        <h2 className="text-lg font-black text-white">Log-overzicht (gatencheck)</h2>
        {gapAlerts.length ? (
          <>
            <p className="mt-1 text-sm font-bold text-red-200">
              Waarschuwing: {gapAlerts.length} gat(en) groter dan {GAP_THRESHOLD_MINUTES} minuten in de laatste {tracksForGap.length}{" "}
              tracks.
            </p>
            <div className="mt-3 max-h-[220px] space-y-2 overflow-auto pr-1">
              {gapAlerts.map((g, idx) => (
                <div key={`${g.newer.id}-${g.older.id}-${idx}`} className="rounded-xl border border-red-500/25 bg-black/30 px-3 py-2 text-sm text-gray-100">
                  <p className="font-black text-red-200">Gat: {g.gapMinutes.toFixed(1)} min</p>
                  <p>
                    {new Date(g.newer.playedAt).toLocaleString("nl-NL")} ({g.newer.artist} — {g.newer.title})
                  </p>
                  <p>
                    {new Date(g.older.playedAt).toLocaleString("nl-NL")} ({g.older.artist} — {g.older.title})
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm font-bold text-emerald-200">
            Geen gaten groter dan {GAP_THRESHOLD_MINUTES} minuten in de laatste {tracksForGap.length || "—"} tracks
            {tracksForGap.length ? "" : " (nog geen data)"}.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <h2 className="mb-3 text-lg font-black text-white">Polling foutenlog</h2>
        {pollErrors.length === 0 ? (
          <p className="text-sm text-gray-300">Nog geen poll-fouten geregistreerd.</p>
        ) : (
          <ul className="max-h-[200px] space-y-1 overflow-auto text-sm text-gray-200">
            {pollErrors
              .slice()
              .reverse()
              .map((e, i) => (
                <li key={`${e.at}-${i}`} className="font-mono text-xs">
                  {new Date(e.at).toLocaleString("nl-NL")} — {e.message}
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <h2 className="mb-3 text-lg font-black text-white">Playlist logging (laatste tracks)</h2>
        {displayTracks.length ? (
          <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
            {displayTracks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {t.artist} — {t.title}
                  </p>
                  <p className="text-xs font-semibold text-gray-400">{new Date(t.playedAt).toLocaleString("nl-NL")}</p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-200">
                  gelogd
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Nog geen tracks in de geschiedenis voor deze zender.</p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <h2 className="mb-3 text-lg font-black text-white">Laatst gepolde info (nu-speelt batch)</h2>
        {monitorJson ? (
          <div className="space-y-2 text-sm text-gray-100">
            <p>
              <span className="font-black text-white">Nu:</span> {monitorJson.current.artist || "-"} — {monitorJson.current.title || "-"}
            </p>
            <p>
              <span className="font-black text-white">Straks:</span>{" "}
              {monitorJson.next ? `${monitorJson.next.artist} — ${monitorJson.next.title}` : "— (niet beschikbaar in GLXY-feed)"}
            </p>
            <p>
              <span className="font-black text-white">Feed updated:</span> {monitorJson.updated}
            </p>
            <p>
              <span className="font-black text-white">Cover:</span>{" "}
              {monitorJson.cover ? (
                <a href={monitorJson.cover} className="break-all text-cyan-300 underline" target="_blank" rel="noreferrer">
                  {monitorJson.cover}
                </a>
              ) : (
                "-"
              )}
            </p>
            <pre className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-gray-200">
              {JSON.stringify(monitorJson, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Laden…</p>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Zenders in poll: {idsQuery || "(geen)"}. Toegangscode via env <span className="font-mono">MONITOR_PAGE_CODE</span>.
      </p>
    </div>
  );
}
