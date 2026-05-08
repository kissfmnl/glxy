"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { clearAlbumCoverLookupLogs, debugAlbumCoverLookup } from "@/app/actions/albumDebugActions";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type LogRow = {
  id: string;
  key: string;
  artist: string;
  title: string;
  source: string;
  queryUrl: string | null;
  httpStatus: number | null;
  resultsCount: number | null;
  coverUrl: string | null;
  error: string | null;
  createdAt: string;
};

export function AlbumCoverDebugPanel() {
  const { data, mutate } = useSWR<{ rows: LogRow[] }>("/api/admin/album-cover-logs", fetcher, {
    refreshInterval: 12_000,
  });
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.artist} ${r.title} ${r.error ?? ""} ${r.httpStatus ?? ""}`.toLowerCase().includes(q));
  }, [rows, filter]);

  async function runTest(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      const fd = new FormData();
      fd.set("artist", artist);
      fd.set("title", title);
      const res = await debugAlbumCoverLookup(fd);
      if (!res.ok) throw new Error(res.error || "Test mislukt");
      setTestResult(res);
      await mutate();
    } catch (e: any) {
      setTestError(String(e?.message || "Test mislukt"));
    } finally {
      setTesting(false);
    }
  }

  async function clearLogs() {
    const res = await clearAlbumCoverLookupLogs();
    if (res.ok) await mutate();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div>
        <h2 className="text-sm font-black text-gray-900 dark:text-white">Album cover debug</h2>
        <p className="mt-1 text-[11px] font-bold text-gray-500 dark:text-white/55">
          Laatste iTunes lookups (misses/HTTP errors/gevonden) + test tool. Auto refresh (±12s).
        </p>
      </div>

      <form onSubmit={runTest} className="grid gap-2 md:grid-cols-2">
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artiest"
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-primary/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel"
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-primary/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={testing}
            className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            {testing ? "Testen…" : "Test iTunes lookup"}
          </button>
          <button
            type="button"
            onClick={() => void mutate()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700"
          >
            Refresh logs
          </button>
          <button
            type="button"
            onClick={() => void clearLogs()}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700"
          >
            Logs leegmaken
          </button>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter (artist/titel/error/status)…"
            className="ml-auto w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-primary/30 md:w-[320px] dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
      </form>

      {testError ? <p className="text-sm font-black text-red-600">{testError}</p> : null}
      {testResult ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-bold text-gray-800 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/80">
          <p>
            <span className="font-black">Key:</span> {testResult.key}
          </p>
          <p>
            <span className="font-black">Cache:</span> {testResult.cacheHit ? "hit" : "miss"}
          </p>
          {testResult.queryUrl ? (
            <p className="truncate">
              <span className="font-black">Query:</span> {testResult.queryUrl}
            </p>
          ) : null}
          {typeof testResult.httpStatus === "number" ? (
            <p>
              <span className="font-black">HTTP:</span> {testResult.httpStatus}
            </p>
          ) : null}
          {typeof testResult.resultsCount === "number" ? (
            <p>
              <span className="font-black">Results:</span> {testResult.resultsCount}
            </p>
          ) : null}
          {testResult.coverUrl ? (
            <p className="truncate">
              <span className="font-black">Cover:</span> {testResult.coverUrl}
            </p>
          ) : null}
          {testResult.error ? (
            <p className="text-red-700">
              <span className="font-black">Error:</span> {testResult.error}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white dark:bg-[#141826]">
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="px-3 py-2 font-black text-gray-600 dark:text-white/60">Tijd</th>
                <th className="px-3 py-2 font-black text-gray-600 dark:text-white/60">Artiest · Titel</th>
                <th className="px-3 py-2 font-black text-gray-600 dark:text-white/60">Status</th>
                <th className="px-3 py-2 font-black text-gray-600 dark:text-white/60">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center font-bold text-gray-500">
                    Nog geen logs.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const when = new Date(r.createdAt).toLocaleString("nl-NL");
                  const status = r.coverUrl ? "gevonden" : r.httpStatus ? `HTTP ${r.httpStatus}` : r.error ? "error" : "geen resultaat";
                  return (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 dark:border-white/10">
                      <td className="px-3 py-2 whitespace-nowrap font-bold text-gray-700 dark:text-white/70">{when}</td>
                      <td className="px-3 py-2 min-w-0">
                        <p className="truncate font-black text-gray-900 dark:text-white">{r.artist}</p>
                        <p className="truncate font-bold text-gray-600 dark:text-white/60">{r.title}</p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 font-black ${
                            r.coverUrl
                              ? "bg-emerald-100 text-emerald-800"
                              : r.httpStatus && r.httpStatus >= 400
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2 min-w-0 font-bold text-gray-700 dark:text-white/70">
                        {r.resultsCount !== null ? <span className="mr-2">results: {r.resultsCount}</span> : null}
                        {r.queryUrl ? <span className="truncate">query: {r.queryUrl}</span> : null}
                        {r.error ? <div className="mt-1 text-red-700 dark:text-red-300">error: {r.error}</div> : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

