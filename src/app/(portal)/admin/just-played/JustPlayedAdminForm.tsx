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
          Panelkleuren, sectiekoppen en accentlijn voor beide blokken; zender-tabs alleen bij JUST PLAYED.
        </p>
      </div>

      <label className="block max-w-xs text-xs font-semibold text-[var(--text-muted)]">
        JUST PLAYED — aantal zichtbare tracks (1–50)
        <input
          type="number"
          name="jpRecentTracksLimit"
          min={1}
          max={50}
          step={1}
          defaultValue={defaults.recentTracksDisplayLimit}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Sectietitel — tekst (#hex)
          <input
            name="jpSectionTitleHex"
            defaultValue={defaults.sectionTitleHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Neon-accent / links (#hex)
          <input
            name="jpSectionAccentHex"
            defaultValue={defaults.sectionAccentHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Panel — achtergrond (#hex)
          <input
            name="jpPanelSurfaceHex"
            defaultValue={defaults.panelSurfaceHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Panel — rand (#hex)
          <input
            name="jpPanelBorderHex"
            defaultValue={defaults.panelBorderHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-black text-[var(--text-main)]">Zender-tabs (JUST PLAYED)</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Actief — achtergrond (#hex)
            <input
              name="jpStationTabSelectedBgHex"
              defaultValue={defaults.stationTabSelectedBgHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Actief — tekst (#hex)
            <input
              name="jpStationTabSelectedTextHex"
              defaultValue={defaults.stationTabSelectedTextHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Inactief — achtergrond (#hex)
            <input
              name="jpStationTabInactiveBgHex"
              defaultValue={defaults.stationTabInactiveBgHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Inactief — rand (#hex)
            <input
              name="jpStationTabInactiveBorderHex"
              defaultValue={defaults.stationTabInactiveBorderHex}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black text-[var(--text-main)]">Playlist-link</h3>
        <label className="mt-2 block max-w-md text-xs font-semibold text-[var(--text-muted)]">
          Tekstkleur (#hex)
          <input
            name="jpPlaylistLinkHex"
            defaultValue={defaults.playlistLinkHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
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
