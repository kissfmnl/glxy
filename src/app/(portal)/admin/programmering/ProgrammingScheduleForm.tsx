"use client";

import { updateProgrammingScheduleAction } from "@/app/actions/programmingBrandingActions";
import { useState } from "react";

export function ProgrammingScheduleForm({ initialJson }: { initialJson: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setMsg(null);
        const res = await updateProgrammingScheduleAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen. Homepage en programmering-pagina worden ververst.");
      }}
      className="card space-y-4 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <label className="block text-xs font-semibold text-[var(--text-muted)]">
        Schema (JSON-array)
        <textarea
          name="scheduleJson"
          defaultValue={initialJson}
          rows={18}
          spellCheck={false}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2 md:text-sm"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-black text-white shadow hover:opacity-95 disabled:opacity-60"
        >
          {busy ? "Bezig…" : "Opslaan"}
        </button>
        {msg ? <p className="text-sm text-[var(--text-muted)]">{msg}</p> : null}
      </div>
    </form>
  );
}
