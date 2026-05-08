"use client";

import { acceptInviteAction } from "@/app/actions/glxyInviteActions";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function InviteAcceptForm({ token, email }: { token: string; email: string }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("password", password);
    const res = await acceptInviteAction(token, fd);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    const sign = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
    if (sign?.error) {
      setError("Account aangemaakt, maar inloggen mislukte. Probeer handmatig op /login.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white/70">
        Account voor <span className="text-white">{email}</span>
      </p>
      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p>
      ) : null}
      <div>
        <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/55">Naam (optioneel)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none ring-cyan-400/40 focus:border-cyan-400/50 focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/55">Kies wachtwoord (min. 8)</label>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none ring-cyan-400/40 focus:border-cyan-400/50 focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--brand-primary)]/95 to-[var(--brand-accent)]/95 px-4 py-3 text-sm font-black text-[#070b14] disabled:opacity-60"
      >
        {loading ? "Account aanmaken…" : "Account aanmaken & inloggen"}
      </button>
      <Link href="/login" className="block text-center text-xs font-semibold text-white/50 hover:text-cyan-200">
        Ik heb al een account
      </Link>
    </form>
  );
}
