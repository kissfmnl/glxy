"use client";

import { updatePlayerUiAction } from "@/app/actions/playerUiActions";
import type { MergedPlayerUi } from "@/lib/playerUi";
import { useState } from "react";

export function PlayerUiForm({ defaults }: { defaults: MergedPlayerUi }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setMsg(null);
        const res = await updatePlayerUiAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen. Vernieuw de publieke site om alle kleuren te zien.");
      }}
      className="card space-y-8 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-black text-[var(--text-main)]">Zenderkaarten (homepage)</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Play staat in het midden van elke kaart; titels links naast het logo. Subtitel kan een andere kleur krijgen.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Play / pauze-icoon (#hex of rgba)
            <input
              name="stationPlayHex"
              defaultValue={defaults.stationPlayHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Radionaam (#hex)
            <input
              name="stationTextHex"
              defaultValue={defaults.stationTextHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Subtitel (#hex of rgba)
            <input
              name="stationSubtextHex"
              defaultValue={defaults.stationSubtextHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 border-t border-white/10 pt-8">
        <h2 className="text-lg font-black text-[var(--text-main)]">Vaste mini-player (onderaan)</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Standaard grijs (`#3f3f46`); pas achtergrond, teksten en accent (play-knop, volumeknop) aan.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Achtergrond (#hex)
            <input
              name="miniBgHex"
              defaultValue={defaults.miniBgHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Rand / border (hex of rgba)
            <input
              name="miniBorderHex"
              defaultValue={defaults.miniBorderHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Titel track (#hex)
            <input
              name="miniTextHex"
              defaultValue={defaults.miniTextHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Label + artiest / subtiel (#hex)
            <input
              name="miniMutedHex"
              defaultValue={defaults.miniMutedHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Play-knop vlak (#hex)
            <input
              name="miniAccentHex"
              defaultValue={defaults.miniAccentHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Icoon op play-knop (#hex)
            <input
              name="miniPlayIconHex"
              defaultValue={defaults.miniPlayIconHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Volume-thumb (#hex)
            <input
              name="miniVolThumbHex"
              defaultValue={defaults.miniVolThumbHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 border-t border-white/10 pt-8">
        <h2 className="text-lg font-black text-[var(--text-main)]">Homepage live-video (bediening)</h2>
        <p className="text-sm text-[var(--text-muted)]">Overlay onderaan de GLXY TV-embed bij hover.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Knoppen / balkje (#hex of rgba)
            <input
              name="heroControlSurfaceHex"
              defaultValue={defaults.heroControlSurfaceHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Icoonkleur / luidspreker (#hex)
            <input
              name="heroControlIconHex"
              defaultValue={defaults.heroControlIconHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Volume-thumb (#hex)
            <input
              name="heroVolThumbHex"
              defaultValue={defaults.heroVolThumbHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
        <button type="submit" disabled={busy} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-50">
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
        {msg ? <p className="text-sm font-semibold text-[var(--brand-primary)]">{msg}</p> : null}
      </div>
    </form>
  );
}
