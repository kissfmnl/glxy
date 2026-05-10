"use client";

import { updateAdminPortalCopyAction } from "@/app/actions/adminPortalCopyActions";
import type { AdminPortalCopy } from "@/lib/adminPortalCopy";
import { useState } from "react";

export function PortalTekstenForm({ defaults }: { defaults: Required<AdminPortalCopy> }) {
  const [stationsIntroHtml, setStationsIntroHtml] = useState(defaults.stationsIntroHtml);
  const [brandingIntroHtml, setBrandingIntroHtml] = useState(defaults.brandingIntroHtml);
  const [playerUiIntroHtml, setPlayerUiIntroHtml] = useState(defaults.playerUiIntroHtml);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="card space-y-6 border border-white/10 bg-white/[0.04] backdrop-blur"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("stationsIntroHtml", stationsIntroHtml);
        fd.set("brandingIntroHtml", brandingIntroHtml);
        fd.set("playerUiIntroHtml", playerUiIntroHtml);
        setBusy(true);
        setMsg(null);
        const res = await updateAdminPortalCopyAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen.");
      }}
    >
      <p className="text-sm text-[var(--text-muted)]">
        Je mag simpele HTML gebruiken, zoals links: <code className="text-[var(--brand-yellow)]">&lt;a href=&quot;…&quot;&gt;…&lt;/a&gt;</code>.
      </p>

      <label className="block space-y-1">
        <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">Zenders &amp; streams — intro</span>
        <textarea
          value={stationsIntroHtml}
          onChange={(e) => setStationsIntroHtml(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">Huisstijl — intro</span>
        <textarea
          value={brandingIntroHtml}
          onChange={(e) => setBrandingIntroHtml(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">Player &amp; weergave — intro</span>
        <textarea
          value={playerUiIntroHtml}
          onChange={(e) => setPlayerUiIntroHtml(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <button type="submit" disabled={busy} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-50">
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
        {msg ? <p className="text-sm font-semibold text-[var(--brand-primary)]">{msg}</p> : null}
      </div>
    </form>
  );
}
