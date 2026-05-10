"use client";

import { createInviteAction } from "@/app/actions/glxyInviteActions";
import { useState } from "react";

export function InviteCreateForm({ allowSuperAdminInvite = false }: { allowSuperAdminInvite?: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setMsg(null);
        setLink(null);
        const res = await createInviteAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else {
          setMsg("Uitnodiging verstuurd of aangemaakt. Geen SMTP? Kopieer de link hieronder naar de gebruiker.");
          if (res.inviteUrl) setLink(res.inviteUrl);
        }
      }}
      className="card space-y-4 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <div>
        <h2 className="text-lg font-black text-[var(--text-main)]">Iemand uitnodigen</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Na acceptatie van de uitnodiging kan de gebruiker inloggen. Rol bepaalt toegang tot admin-functies.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          E-mail
          <input
            name="email"
            type="email"
            required
            placeholder="persoon@voorbeeld.nl"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Rol
          <select
            name="role"
            defaultValue="DJ"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
          >
            <option value="DJ">DJ / Host</option>
            <option value="ADMIN">Beheerder (admin)</option>
            {allowSuperAdminInvite ? <option value="SUPER_ADMIN">Super-admin</option> : null}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="btn-primary rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-50"
        >
          {busy ? "Bezig…" : "Uitnodiging versturen"}
        </button>
      </div>
      {msg ? <p className="text-sm font-semibold text-cyan-200/90">{msg}</p> : null}
      {link ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs font-mono break-all text-emerald-100">
          {link}
        </div>
      ) : null}
    </form>
  );
}
