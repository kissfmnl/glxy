"use client";

import { updateNpWordFilterAction } from "@/app/actions/npWordFilterActions";
import type { NpFilterRule, NpFilterScope } from "@/lib/npWordFilter";
import { useState } from "react";

function emptyRule(): NpFilterRule {
  return { phrase: "", scope: "everywhere" };
}

export function NpWordFilterForm({ rules: initialRules }: { rules: NpFilterRule[] }) {
  const [rows, setRows] = useState<NpFilterRule[]>(() =>
    initialRules.length > 0 ? initialRules.map((r) => ({ phrase: r.phrase, scope: r.scope })) : [emptyRule()],
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function setScope(i: number, scope: NpFilterScope) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, scope } : r)));
  }

  function setPhrase(i: number, phrase: string) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, phrase } : r)));
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const cleaned = rows
          .map((r) => ({ phrase: r.phrase.trim(), scope: r.scope }))
          .filter((r) => r.phrase.length > 0);
        const fd = new FormData();
        fd.set("npRulesJson", JSON.stringify(cleaned));
        setBusy(true);
        setMsg(null);
        const res = await updateNpWordFilterAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen. Bestaande nu-speelt cache vernieuwt bij de volgende poll (~20 s).");
      }}
      className="card space-y-4 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <div>
        <h2 className="text-lg font-black text-[var(--text-main)]">Nu-speelt tekstfilter</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Per regel een woord of zinsdeel dat uit <strong className="text-[var(--text-main)]">titel én artiest</strong> wordt gehaald
          (hoofdletterongevoelig). Kies of het overal weg moet — inclusief Just played en geschiedenis — of alleen op de live
          nu-speeltweergave (kaarten, programmering-liveblok), terwijl het wél in Just played blijft.
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:grid-cols-[1fr_minmax(11rem,auto)_auto] sm:items-end">
          <span>Zin / woord</span>
          <span className="hidden sm:inline">Waar filteren</span>
          <span className="sr-only sm:not-sr-only sm:invisible">Verwijderen</span>
        </div>
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_minmax(11rem,auto)_auto] sm:items-center">
              <input
                type="text"
                value={row.phrase}
                onChange={(ev) => setPhrase(i, ev.target.value)}
                spellCheck={false}
                placeholder="bijv. GLXY.RADIO"
                className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
              />
              <label className="sm:sr-only text-xs font-semibold text-[var(--text-muted)]">Waar filteren</label>
              <select
                value={row.scope}
                onChange={(ev) => setScope(i, ev.target.value as NpFilterScope)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2 sm:w-auto"
              >
                <option value="everywhere">Overal (ook Just played)</option>
                <option value="live_np_only">Alleen live nu-speelt</option>
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
