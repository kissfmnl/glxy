"use client";

import { updateJustPlayedBrandingAction } from "@/app/actions/justPlayedBrandingActions";
import type { PublicJustPlayedConfig } from "@/lib/justPlayedConfig";
import { useState } from "react";

export function JustPlayedAdminForm({ defaults }: { defaults: PublicJustPlayedConfig }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setMsg(null);
        const res = await updateJustPlayedBrandingAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen.");
      }}
      className="card space-y-6 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <div>
        <h2 className="text-lg font-black text-[var(--text-main)]">Homepage: JUST PLAYED &amp; SCHEDULE</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Kleuren voor de titelbadges, de zenderkeuze-knoppen (playlist) en de playlist-link onderaan JUST PLAYED.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-black text-[var(--text-main)]">Titelblok “JUST PLAYED”</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Achtergrond (#hex)
            <input
              name="jpTitleBgHex"
              defaultValue={defaults.titleBgHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Tekst (#hex)
            <input
              name="jpTitleTextHex"
              defaultValue={defaults.titleTextHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-black text-[var(--text-main)]">Titelblok “SCHEDULE”</h3>
        <p className="text-xs text-[var(--text-muted)]">Zelfde vorm als JUST PLAYED; titeltekst komt uit site-instellingen / wave-copy.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Achtergrond (#hex)
            <input
              name="jpScheduleTitleBgHex"
              defaultValue={defaults.scheduleTitleBgHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Tekst (#hex)
            <input
              name="jpScheduleTitleTextHex"
              defaultValue={defaults.scheduleTitleTextHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-black text-[var(--text-main)]">Zenderkeuze (playlist-knoppen)</h3>
        <p className="text-xs text-[var(--text-muted)]">Actieve zender boven de tracklijst in JUST PLAYED.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Geselecteerd — achtergrond (#hex)
            <input
              name="jpStationTabSelectedBgHex"
              defaultValue={defaults.stationTabSelectedBgHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Geselecteerd — tekst (#hex)
            <input
              name="jpStationTabSelectedTextHex"
              defaultValue={defaults.stationTabSelectedTextHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-black text-[var(--text-main)]">Playlist-link (onderaan JUST PLAYED)</h3>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Tekstkleur (#hex)
          <input
            name="jpPlaylistLinkHex"
            defaultValue={defaults.playlistLinkHex}
            className="mt-1 w-full max-w-md rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
      </div>

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
