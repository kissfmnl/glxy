"use client";

import { updateFooterBrandingAction } from "@/app/actions/footerBrandingActions";
import type { PublicFooterConfig } from "@/lib/footerConfig";
import { useState } from "react";

export function FooterAdminForm({ defaults }: { defaults: PublicFooterConfig }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setMsg(null);
        const res = await updateFooterBrandingAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen.");
      }}
      className="card space-y-5 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <div>
        <h2 className="text-lg font-black text-[var(--text-main)]">Footer (publieke site)</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Achtergrondkleur, icoonkleur, optioneel eigen footer-logo en social links. Leeg laten bij een link gebruikt de site-default (zoals nu ingesteld).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Achtergrond (#hex)
          <input
            name="footerBgHex"
            defaultValue={defaults.bgHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Icoonkleur (#hex)
          <input
            name="footerIconHex"
            defaultValue={defaults.iconHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
      </div>

      <label className="block text-xs font-semibold text-[var(--text-muted)]">
        Footer-logo URL (optioneel — leeg = zelfde als hoofdlogo uit huisstijl)
        <input
          name="footerLogoUrl"
          defaultValue={defaults.logoUrl ?? ""}
          placeholder="https://… of /pad/naar/logo.png"
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
        />
      </label>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">Social & contact</p>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          WhatsApp (link of telefoonnummer)
          <input
            name="footerWhatsappUrl"
            defaultValue={defaults.whatsappUrl ?? ""}
            placeholder="https://wa.me/31850292222"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          TikTok
          <input
            name="footerTiktokUrl"
            defaultValue={defaults.tiktokUrl ?? ""}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Instagram
          <input
            name="footerInstagramUrl"
            defaultValue={defaults.instagramUrl ?? ""}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          YouTube
          <input
            name="footerYoutubeUrl"
            defaultValue={defaults.youtubeUrl ?? ""}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Twitch
          <input
            name="footerTwitchUrl"
            defaultValue={defaults.twitchUrl ?? ""}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          E-mail (mailto of adres)
          <input
            name="footerMailUrl"
            defaultValue={defaults.mailUrl ?? ""}
            placeholder="mailto:studio@glxy.radio"
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
