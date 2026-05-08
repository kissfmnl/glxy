"use client";

import { useSession } from "next-auth/react";
import { updateProfile } from "@/app/actions/profileActions";
import { useState } from "react";
import Link from "next/link";

export default function SettingsPageClient() {
  const { data: session, update } = useSession();
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  if (!session) return <div className="p-8">Laden...</div>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    if (result.success) {
      setStatus({ success: true });
      await update();
    } else {
      setStatus({ error: result.error });
    }
    setLoading(false);
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
        <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Systeem instellingen
      </h1>

      <div className="card shadow-premium border-none bg-white dark:bg-card mb-8">
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">Mijn profiel</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Naam</label>
              <input
                name="name"
                type="text"
                defaultValue={session.user?.name ?? ""}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">E-mailadres</label>
              <input
                name="email"
                type="email"
                defaultValue={session.user?.email ?? ""}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                required
              />
            </div>
          </div>

          {status?.success && (
            <p className="text-sm font-bold text-green-500 bg-green-500/10 p-3 rounded-xl border border-green-500/20 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Instellingen succesvol bijgewerkt!
            </p>
          )}

          {status?.error && (
            <p className="text-sm font-bold text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{status.error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? "Opslaan..." : "Configuratie opslaan"}
          </button>
        </form>
      </div>

      {isAdmin && (
        <div className="card shadow-premium mb-8 border-2 border-brand-primary/15 bg-white dark:bg-card">
          <h2 className="mb-2 text-lg font-black text-gray-900 dark:text-white">Website</h2>
          <p className="mb-4 text-xs text-gray-500 dark:text-white/55">
            Homepage, website-teksten, programmering, concerten, radio en carrière voor de publieke site.
          </p>
          <Link
            href="/settings/site"
            className="flex items-center justify-center rounded-2xl bg-[#1e375a] px-5 py-4 text-center text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#152a45] hover:shadow-md active:translate-y-0"
          >
            Open site instellingen
          </Link>
          <Link
            href="/settings/developer"
            className="mt-3 block text-center text-xs font-bold text-brand-primary underline-offset-2 hover:underline"
          >
            Developer opties (mock berichten)
          </Link>
        </div>
      )}
    </div>
  );
}
