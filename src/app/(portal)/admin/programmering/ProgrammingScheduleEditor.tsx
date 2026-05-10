"use client";

import { updateProgrammingScheduleAction } from "@/app/actions/programmingBrandingActions";
import type { ProgrammingEditorRow } from "@/lib/programmingScheduleRows";
import { editorRowsToSchedulePayload } from "@/lib/programmingScheduleRows";
import { useMemo, useState } from "react";

const WEEKDAYS: { v: number; label: string }[] = [
  { v: 1, label: "Ma" },
  { v: 2, label: "Di" },
  { v: 3, label: "Wo" },
  { v: 4, label: "Do" },
  { v: 5, label: "Vr" },
  { v: 6, label: "Za" },
  { v: 7, label: "Zo" },
];

function newRow(): ProgrammingEditorRow {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}`,
    weekday: 1,
    startHm: "09:00",
    endHm: "12:00",
    showName: "",
    djName: "",
  };
}

export function ProgrammingScheduleEditor({ initialRows }: { initialRows: ProgrammingEditorRow[] }) {
  const sortedInitial = useMemo(() => {
    return [...initialRows].sort((a, b) => a.weekday - b.weekday || a.startHm.localeCompare(b.startHm));
  }, [initialRows]);

  const [rows, setRows] = useState<ProgrammingEditorRow[]>(sortedInitial.length ? sortedInitial : [newRow()]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const payloadJson = useMemo(() => JSON.stringify(editorRowsToSchedulePayload(rows), null, 2), [rows]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData();
        const trimmed = editorRowsToSchedulePayload(rows);
        fd.set("scheduleJson", trimmed.length === 0 ? "" : JSON.stringify(trimmed));
        setBusy(true);
        setMsg(null);
        const res = await updateProgrammingScheduleAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen.");
      }}
      className="card space-y-4 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          Blokken sorteren op dag en tijd. Hostnaam is optioneel (moet matchen met een host uit de site waar je die gebruikt).
        </p>
        <button
          type="button"
          onClick={() => setRows((r) => [...r, newRow()])}
          className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
        >
          Blok toevoegen
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:flex-wrap lg:items-end"
          >
            <label className="block w-full min-w-[5.5rem] text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] lg:w-24">
              Dag
              <select
                value={row.weekday}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, weekday: Number(e.target.value) } : x)),
                  )
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-2 py-2 text-sm font-bold text-white"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.v} value={d.v}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block w-full min-w-[7rem] text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] lg:w-32">
              Start
              <input
                type="time"
                value={row.startHm}
                onChange={(e) =>
                  setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, startHm: e.target.value } : x)))
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-2 py-2 font-mono text-sm text-white"
              />
            </label>
            <label className="block w-full min-w-[7rem] text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] lg:w-32">
              Einde
              <input
                type="time"
                value={row.endHm}
                onChange={(e) =>
                  setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, endHm: e.target.value } : x)))
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-2 py-2 font-mono text-sm text-white"
              />
            </label>
            <label className="block min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] lg:min-w-[200px]">
              Programma
              <input
                value={row.showName}
                onChange={(e) =>
                  setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, showName: e.target.value } : x)))
                }
                placeholder="Naam van het programma"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-2 py-2 text-sm text-white placeholder:text-white/35"
              />
            </label>
            <label className="block min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] lg:min-w-[160px]">
              Host (optioneel)
              <input
                value={row.djName}
                onChange={(e) =>
                  setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, djName: e.target.value } : x)))
                }
                placeholder="Bijv. Nova"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-2 py-2 text-sm text-white placeholder:text-white/35"
              />
            </label>
            <div className="flex w-full justify-end lg:w-auto lg:shrink-0">
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-black text-red-200 hover:bg-red-500/15"
              >
                Verwijderen
              </button>
            </div>
          </div>
        ))}
      </div>

      <details className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-xs text-[var(--text-muted)]">
        <summary className="cursor-pointer font-bold text-[var(--text-main)]">JSON-voorbeeld (alleen ter inzage)</summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-black/40 p-2 font-mono text-[10px] text-white/80">{payloadJson}</pre>
      </details>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-black text-white shadow hover:opacity-95 disabled:opacity-60"
        >
          {busy ? "Bezig…" : "Opslaan"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!confirm("Alle aangepaste blokken wissen en terug naar demo-schema?")) return;
            const fd = new FormData();
            fd.set("scheduleJson", "");
            setBusy(true);
            setMsg(null);
            const res = await updateProgrammingScheduleAction(fd);
            setBusy(false);
            if (res.error) setMsg(res.error);
            else {
              setMsg("Teruggezet naar demo. Vernieuw de pagina om te bewerken.");
              window.location.reload();
            }
          }}
          className="rounded-xl border border-white/25 px-4 py-2.5 text-xs font-black text-white/90 hover:bg-white/10"
        >
          Demo herstellen
        </button>
        {msg ? <p className="text-sm text-[var(--text-muted)]">{msg}</p> : null}
      </div>
    </form>
  );
}
