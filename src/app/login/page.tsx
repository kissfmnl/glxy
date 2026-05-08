"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ongeldige inloggegevens. Probeer het opnieuw.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Er is een onbekende fout opgetreden.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black transition-colors duration-200 p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-primary/20 mb-4">
            K
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">KISS FM Portaal</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">DJ & Admin Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                E-mailadres
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dj@kissfm.nl"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                Wachtwoord
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary justify-center py-4 text-sm shadow-lg shadow-brand-primary/20 disabled:opacity-50"
            >
              {isLoading ? "Bezig met inloggen..." : "Inloggen →"}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.2em]">
          Interne Toegang — KISS FM DJ TEAM
        </p>
      </div>
    </div>
  );
}
