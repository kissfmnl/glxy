"use client";

import { updateBrandingAction } from "@/app/actions/glxyBrandingActions";
import { useState } from "react";

type Defaults = {
  primaryHex: string;
  accentHex: string;
  navyHex: string;
  logoUrl: string;
  faviconUrl: string;
  homeHlsUrl: string;
};

export function BrandingForm({ defaults }: { defaults: Defaults }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setMsg(null);
        const res = await updateBrandingAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen. Publieke site ververst bij volgende bezoek (cache).");
      }}
      className="card space-y-5 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <div>
        <h2 className="text-lg font-black text-[var(--text-main)]">Kleuren</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Worden als CSS-variabelen op de hele site gezet (o.a. knoppen en accenten).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Primair (#hex)
          <input
            name="primaryHex"
            defaultValue={defaults.primaryHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Accent (#hex)
          <input
            name="accentHex"
            defaultValue={defaults.accentHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Navy (#hex)
          <input
            name="navyHex"
            defaultValue={defaults.navyHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
          />
        </label>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-lg font-black text-[var(--text-main)]">Logo & icoon</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Gebruik een publiek bereikbare https-URL (of een pad op deze site).</p>
      </div>
      <label className="block text-xs font-semibold text-[var(--text-muted)]">
        Logo-URL (header)
        <input
          name="logoUrl"
          defaultValue={defaults.logoUrl}
          placeholder="https://…/glxy-logo.svg"
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
        />
      </label>
      <label className="block text-xs font-semibold text-[var(--text-muted)]">
        Favicon-URL
        <input
          name="faviconUrl"
          defaultValue={defaults.faviconUrl}
          placeholder="https://…/favicon.png"
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
        />
      </label>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-lg font-black text-[var(--text-main)]">Homepage livestream (HLS)</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Standaard geluid uit, video speelt gemute mee waar de browser het toelaat.</p>
      </div>
      <label className="block text-xs font-semibold text-[var(--text-muted)]">
        .m3u8 URL
        <input
          name="homeHlsUrl"
          defaultValue={defaults.homeHlsUrl}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-cyan-500/30 focus:ring-2"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-50">
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
        {msg ? <p className="text-sm font-semibold text-cyan-200/90">{msg}</p> : null}
      </div>
    </form>
  );
}
