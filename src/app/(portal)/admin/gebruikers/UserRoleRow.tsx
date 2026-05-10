"use client";

import { updateUserRoleAction } from "@/app/actions/userRoleActions";
import type { Role } from "@prisma/client";
import { useState } from "react";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "DJ", label: "DJ / Host" },
  { value: "ADMIN", label: "Beheerder" },
  { value: "SUPER_ADMIN", label: "Super-admin" },
];

export function UserRoleRow({
  userId,
  role,
  canEditRoles,
}: {
  userId: string;
  role: Role;
  canEditRoles: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sel, setSel] = useState<Role>(role);

  if (!canEditRoles) {
    return <span className="font-black text-cyan-200/90">{role}</span>;
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setMsg(null);
        const res = await updateUserRoleAction(fd);
        setBusy(false);
        if (res.error) {
          setMsg(res.error);
          return;
        }
        const next = String(fd.get("role") ?? "") as Role;
        if (next === "DJ" || next === "ADMIN" || next === "SUPER_ADMIN") setSel(next);
        setMsg("Opgeslagen");
        window.setTimeout(() => setMsg(null), 2500);
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        value={sel}
        onChange={(e) => setSel(e.target.value as Role)}
        className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs font-black text-white outline-none ring-cyan-500/30 focus:ring-2"
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg border border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/15 px-2 py-1 text-[11px] font-black text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/25 disabled:opacity-50"
      >
        {busy ? "…" : "Opslaan"}
      </button>
      {msg ? <span className="text-[11px] font-semibold text-emerald-300/90">{msg}</span> : null}
    </form>
  );
}
