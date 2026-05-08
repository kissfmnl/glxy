"use client";

import { useMemo, useState } from "react";

type Track = {
  dw: number;
  vw: number | null;
  aw: number | "NEW" | null;
  sts: string;
  artist: string;
  title: string;
};

function normalizePositions(tracks: Track[]): Track[] {
  return tracks.map((t, i) => ({ ...t, dw: i + 1 }));
}

function trackKey(t: Pick<Track, "artist" | "title">) {
  return `${t.artist}`.trim().toLowerCase() + "|" + `${t.title}`.trim().toLowerCase();
}

function safeParseTracks(raw: string): Track[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizePositions(
      parsed
        .map((x): Track => {
          const awRaw = String(x?.aw ?? "").trim().toUpperCase();
          const aw: Track["aw"] =
            awRaw === "NEW" ? "NEW" : awRaw === "" ? null : Number.isFinite(Number(awRaw)) ? Math.trunc(Number(awRaw)) : null;
          const vwRaw = String(x?.vw ?? "").trim();
          const vw: number | null = vwRaw === "" || !Number.isFinite(Number(vwRaw)) ? null : Math.trunc(Number(vwRaw));
          return {
            dw: Number.isFinite(Number(x?.dw)) ? Math.trunc(Number(x.dw)) : 0,
            vw,
            aw,
            sts: String(x?.sts ?? "").trim(),
            artist: String(x?.artist ?? "").trim(),
            title: String(x?.title ?? "").trim(),
          };
        })
        .filter((t) => t.artist || t.title)
    );
  } catch {
    return [];
  }
}

export function Kiss40TracksEditor({
  initialTracksJson,
  previousTracksJson,
  weekLabel,
}: {
  initialTracksJson: string;
  previousTracksJson: string;
  weekLabel: string;
}) {
  const [tracks, setTracks] = useState<Track[]>(() => safeParseTracks(initialTracksJson));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJson, setRawJson] = useState(initialTracksJson || "[]");
  const [search, setSearch] = useState("");
  const [quickArtist, setQuickArtist] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPosition, setQuickPosition] = useState("");
  const prevTracks = useMemo(() => safeParseTracks(previousTracksJson || "[]"), [previousTracksJson]);
  const prevMap = useMemo(() => {
    const m = new Map<string, Track>();
    for (const t of prevTracks) m.set(trackKey(t), t);
    return m;
  }, [prevTracks]);
  const computedTracks = useMemo(() => {
    const base = normalizePositions(tracks);
    return base.map((t, i) => {
      const dw = i + 1;
      const prev = prevMap.get(trackKey(t));
      if (!prev) return { ...t, dw, vw: null, aw: "NEW" as const, sts: "NEW" };
      const prevAw = prev.aw === "NEW" || prev.aw === null ? 1 : Number(prev.aw);
      const aw: Track["aw"] = Number.isFinite(prevAw) ? prevAw + 1 : 2;
      const vw = prev.dw;
      const delta = vw - dw;
      const sts = delta === 0 ? "-" : `${delta > 0 ? "↑" : "↓"}${Math.abs(delta)}`;
      return { ...t, dw, vw, aw, sts };
    });
  }, [tracks, prevMap]);
  const serialized = useMemo(() => JSON.stringify(computedTracks), [computedTracks]);
  const filteredIndexes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tracks.map((_, i) => i);
    return tracks
      .map((t, i) => ({ i, hit: `${t.artist} ${t.title}`.toLowerCase().includes(q) }))
      .filter((x) => x.hit)
      .map((x) => x.i);
  }, [tracks, search]);
  const totalCount = computedTracks.length;
  const newCount = computedTracks.filter((t) => t.aw === "NEW").length;
  const isExactly40 = totalCount === 40;

  function updateRow(index: number, patch: Partial<Track>) {
    setTracks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeRow(index: number) {
    setTracks((prev) => normalizePositions(prev.filter((_, i) => i !== index)));
  }

  function moveRow(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    setTracks((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return normalizePositions(copy);
    });
  }

  function applyRawJson() {
    setTracks(safeParseTracks(rawJson));
  }

  function addQuickTop() {
    const artist = quickArtist.trim();
    const title = quickTitle.trim();
    if (!artist || !title) return;
    setTracks((prev) => {
      const insertAtRaw = Number(quickPosition);
      const insertAt =
        Number.isFinite(insertAtRaw) && insertAtRaw > 0
          ? Math.min(prev.length, Math.max(0, Math.trunc(insertAtRaw) - 1))
          : 0;
      const copy = [...prev];
      copy.splice(insertAt, 0, { dw: 1, artist, title, vw: null, aw: "NEW", sts: "NEW" });
      return normalizePositions(copy);
    });
    setQuickArtist("");
    setQuickTitle("");
    setQuickPosition("");
  }

  function exportPdf() {
    const esc = (v: string) =>
      v
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    const rows = computedTracks
      .map(
        (t) =>
          `<tr><td>${t.dw}</td><td>${t.vw ?? "-"}</td><td>${t.aw ?? "-"}</td><td>${esc(t.sts || "-")}</td><td>${esc(t.artist)}</td><td>${esc(t.title)}</td></tr>`
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>KISS40 ${weekLabel}</title><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
      .head{display:flex;align-items:center;gap:14px;margin:0 0 12px}
      .logo{width:58px;height:58px;object-fit:contain}
      h1{margin:0 0 4px;font-size:24px}
      p{margin:0 0 12px;color:#334155}
      table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:12px;border:1px solid #64748b;background:#fff}
      th,td{padding:6px 8px;text-align:left;vertical-align:top;border:0}
      thead th{background:#e2e8f0;border-bottom:1px solid #64748b}
      thead th+th{border-left:1px solid #94a3b8}
      tbody td+td{border-left:1px solid #cbd5e1}
      tbody tr td{border-bottom:1px solid #94a3b8}
      tbody tr:last-child td{border-bottom:0}
      tr{break-inside:avoid;page-break-inside:avoid}
      @media print{
        *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      }
    </style></head><body><div class="head"><img class="logo" src="/api/favicon" alt="KISS FM logo" /><div><h1>KISS40</h1><p>Week van ${weekLabel}</p></div></div><table><thead><tr><th>Positie</th><th>Vorige week</th><th>Aantal weken</th><th>Stijging/daling</th><th>Artiest</th><th>Titel</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 100);
  }

  return (
    <div className="mt-5 space-y-4">
      <input type="hidden" name="tracksJson" value={serialized} />

      <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">KISS40 beheer</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportPdf}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-black text-gray-800"
            >
              Exporteer als PDF
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
          <span className="rounded-full bg-white px-2 py-1 text-gray-700">Totaal: {totalCount}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">NEW: {newCount}</span>
          <span className={`rounded-full px-2 py-1 ${isExactly40 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {isExactly40 ? "Exact 40 nummers" : `Moet 40 zijn (nu ${totalCount})`}
          </span>
        </div>
        <p className="mt-2 text-xs font-bold text-gray-600">
          Sleep, Positie, Vorige week, Aantal weken en Stijging/daling worden automatisch bijgehouden op basis
          van vorige week.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Nieuw nummer toevoegen</p>
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_160px_auto]">
          <input
            value={quickArtist}
            onChange={(e) => setQuickArtist(e.target.value)}
            placeholder="Artiest"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900"
          />
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Titel"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900"
          />
          <input
            value={quickPosition}
            onChange={(e) => setQuickPosition(e.target.value)}
            placeholder="Positie (optioneel)"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900"
          />
          <button
            type="button"
            onClick={addQuickTop}
            className="rounded-lg bg-[#1e375a] px-3 py-2 text-xs font-black text-white"
          >
            Nummer toevoegen
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op artiest of titel..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left font-black text-gray-500">Sleep</th>
              <th className="px-2 py-2 text-left font-black text-gray-500">Positie</th>
              <th className="px-2 py-2 text-left font-black text-gray-500">Vorige week</th>
              <th className="px-2 py-2 text-left font-black text-gray-500">Aantal weken</th>
              <th className="px-2 py-2 text-left font-black text-gray-500">Stijging/daling</th>
              <th className="px-2 py-2 text-left font-black text-gray-500">Artiest</th>
              <th className="px-2 py-2 text-left font-black text-gray-500">Titel</th>
              <th className="px-2 py-2 text-left font-black text-gray-500">Acties</th>
            </tr>
          </thead>
          <tbody>
            {filteredIndexes.map((i) => {
              const t = computedTracks[i];
              const rowColorClass =
                t.aw === "NEW"
                  ? "bg-violet-50/70"
                  : t.sts.startsWith("↑")
                    ? "bg-emerald-50/70"
                    : t.sts.startsWith("↓")
                      ? "bg-red-50/70"
                      : "bg-white";
              return (
              <tr
                key={`${i}_${t.artist}_${t.title}`}
                className={`border-b border-gray-100 ${rowColorClass} ${dropTargetIndex === i ? "border-t-4 border-t-brand-primary bg-brand-primary/5" : ""}`}
                draggable
                onDragStart={() => {
                  setDragIndex(i);
                  setDropTargetIndex(i);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetIndex(i);
                }}
                onDrop={() => {
                  if (dragIndex === null) return;
                  moveRow(dragIndex, i);
                  setDragIndex(null);
                  setDropTargetIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDropTargetIndex(null);
                }}
              >
                <td className="px-2 py-2.5 align-middle">
                  <div className="flex h-full items-center justify-center">
                    <span className="inline-flex h-9 w-9 select-none items-center justify-center text-xl font-black leading-none text-gray-600">≡</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 align-top">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white font-black text-gray-800">
                    {i + 1}
                  </div>
                </td>
                <td className="px-2 py-2"><span className="inline-flex min-w-[60px] rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 font-bold text-gray-900">{t.vw ?? "-"}</span></td>
                <td className="px-2 py-2"><span className="inline-flex min-w-[72px] rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 font-bold text-gray-900">{t.aw ?? "-"}</span></td>
                <td className="px-2 py-2"><span className="inline-flex min-w-[72px] rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 font-bold text-gray-900">{t.sts || "-"}</span></td>
                <td className="px-2 py-2">
                  <input
                    value={t.artist}
                    onChange={(e) => updateRow(i, { artist: e.target.value })}
                    className="w-full min-w-[220px] rounded-lg border border-gray-200 px-2 py-1.5 font-bold text-gray-900"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={t.title}
                    onChange={(e) => updateRow(i, { title: e.target.value })}
                    className="w-full min-w-[220px] rounded-lg border border-gray-200 px-2 py-1.5 font-bold text-gray-900"
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveRow(i, Math.max(0, i - 1))}
                      className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-black text-gray-700"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(i, Math.min(tracks.length - 1, i + 1))}
                      className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-black text-gray-700"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-lg font-black leading-none text-red-600 transition-colors hover:bg-red-50"
                      aria-label="Verwijder nummer"
                      title="Verwijder nummer"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <button
          type="button"
          onClick={() => setShowRawJson((v) => !v)}
          className="text-xs font-black text-brand-primary hover:underline"
        >
          {showRawJson ? "Geavanceerd JSON verbergen" : "Geavanceerd JSON tonen"}
        </button>
        {showRawJson ? (
          <div className="mt-3 space-y-3">
            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-xs text-gray-900"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={applyRawJson}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-800"
            >
              JSON toepassen in editor
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Verdwenen uit vorige week</p>
        <div className="mt-2">
          {(() => {
            const currentKeys = new Set(computedTracks.map((t) => trackKey(t)));
            const gone = prevTracks.filter((t) => !currentKeys.has(trackKey(t)));
            if (gone.length === 0) {
              return <p className="text-xs font-bold text-gray-600">Geen verdwenen nummers.</p>;
            }
            return (
              <ul className="space-y-1">
                {gone.map((t, idx) => (
                  <li key={`${trackKey(t)}_${idx}`} className="text-xs font-bold text-gray-700">
                    {t.artist} — {t.title}
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
