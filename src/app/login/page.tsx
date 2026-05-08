"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCb = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCb.startsWith("/") ? rawCb : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("E-mail of wachtwoord klopt niet.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 glxy-public-bg">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/45 p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)] backdrop-blur-xl">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.35em] text-[#00f0ff]/80">GLXY Radio</p>
        <h1 className="mt-3 text-center text-2xl font-black text-white">Inloggen</h1>
        <p className="mt-2 text-center text-sm font-semibold text-white/60">Gebruik je uitgenodigde account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p>
          ) : null}
          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/55">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none ring-cyan-400/40 focus:border-cyan-400/50 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-white/55">Wachtwoord</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none ring-cyan-400/40 focus:border-cyan-400/50 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--brand-primary)]/95 to-[var(--brand-accent)]/95 px-4 py-3 text-sm font-black text-[#070b14] disabled:opacity-60"
          >
            {loading ? "Even geduld…" : "Inloggen"}
          </button>
        </form>

        <Link href="/" className="mt-6 block text-center text-xs font-semibold text-white/55 hover:text-cyan-200">
          ← Terug naar de site
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--brand-navy)]" />}>
      <LoginForm />
    </Suspense>
  );
}
