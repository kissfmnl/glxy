"use client";

import { updateNpWordFilterAction } from "@/app/actions/npWordFilterActions";
import { useState } from "react";

export function NpWordFilterForm({ phrases }: { phrases: string[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
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
          Elke regel is een woord of zinsdeel dat uit <strong className="text-[var(--text-main)]">titel én artiest</strong> wordt
          gehaald (hoofdletterongevoelig). Bijvoorbeeld <code className="text-[var(--brand-yellow)]">GLXY.RADIO</code> of{" "}
          <code className="text-[var(--brand-yellow)]">KISS FM</code>. Leeg laten = geen filter.
        </p>
      </div>

      <label className="block text-xs font-semibold text-[var(--text-muted)]">
        Woorden / zinnen (één per regel, max. 40 regels)
        <textarea
          name="npPhrases"
          defaultValue={phrases.join("\n")}
          rows={8}
          spellCheck={false}
          placeholder={"GLXY.RADIO\nRadio Station Name"}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
        />
      </label>

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
