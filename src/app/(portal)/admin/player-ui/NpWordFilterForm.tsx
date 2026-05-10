"use client";

import { updateNpWordFilterAction } from "@/app/actions/npWordFilterActions";
import type { NpFilterMode, NpFilterRule } from "@/lib/npWordFilter";
import { useState } from "react";

function emptyRule(): NpFilterRule {
  return { phrase: "", mode: "strip" };
}

export function NpWordFilterForm({ rules: initialRules }: { rules: NpFilterRule[] }) {
  const [rows, setRows] = useState<NpFilterRule[]>(() =>
    initialRules.length > 0 ? initialRules.map((r) => ({ phrase: r.phrase, mode: r.mode })) : [emptyRule()],
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function setMode(i: number, mode: NpFilterMode) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, mode } : r)));
  }

  function setPhrase(i: number, phrase: string) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, phrase } : r)));
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const cleaned = rows
          .map((r) => ({ phrase: r.phrase.trim(), mode: r.mode }))
          .filter((r) => r.phrase.length > 0);
        const fd = new FormData();
        fd.set("npRulesJson", JSON.stringify(cleaned));
        setBusy(true);
        setMsg(null);
        const res = await updateNpWordFilterAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen. Nu-speelt cache vernieuwt bij de volgende poll (~1 min of bij sitebezoek).");
      }}
      className="card space-y-4 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <div>
        <h2 className="text-lg font-black text-[var(--text-main)]">Nu-speelt tekstfilter</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          <strong className="text-[var(--text-main)]">Alleen tekst verwijderen</strong> haalt de zin uit titel én artiest overal weg
          (live, Just played, cover-zoekopdrachten) — de rest blijft staan.
          <strong className="text-[var(--text-main)]"> Heel item verbergen</strong> zorgt dat dit nummer nergens als nu-speelt of in Just
          played verschijnt zolang de zin in de metadata voorkomt (hoofdletterongevoelig).
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:grid-cols-[1fr_minmax(13rem,auto)_auto] sm:items-end">
          <span>Zin / woord</span>
          <span className="hidden sm:inline">Gedrag</span>
          <span className="sr-only sm:not-sr-only sm:invisible">Verwijderen</span>
        </div>
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_minmax(13rem,auto)_auto] sm:items-center">
              <input
                type="text"
                value={row.phrase}
                onChange={(ev) => setPhrase(i, ev.target.value)}
                spellCheck={false}
                placeholder="bijv. GLXY.RADIO of (GLXY INTRO)"
                className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
              />
              <label className="sm:sr-only text-xs font-semibold text-[var(--text-muted)]">Gedrag</label>
              <select
                value={row.mode}
                onChange={(ev) => setMode(i, ev.target.value as NpFilterMode)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2 sm:w-auto"
              >
                <option value="strip">Alleen tekst verwijderen</option>
                <option value="hide_full">Heel item verbergen</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setRows((prev) => {
                    const next = prev.filter((_, j) => j !== i);
                    return next.length === 0 ? [emptyRule()] : next;
                  })
                }
                className="rounded-xl border border-white/15 px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-white/5"
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyRule()])}
          className="text-sm font-semibold text-[var(--brand-yellow)] underline-offset-2 hover:underline"
        >
          Regel toevoegen
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-black text-white shadow hover:opacity-95 disabled:opacity-60"
        >
          {busy ? "Bezig…" : "Filter opslaan"}
        </button>
        {msg ? <p className="text-sm text-[var(--text-muted)]">{msg}</p> : null}
      </div>
    </form>
  );
}
