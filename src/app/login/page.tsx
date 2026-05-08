"use client";

import Link from "next/link";

export default function LoginDemoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 glxy-public-bg">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/45 p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)] backdrop-blur-xl">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.35em] text-[#00f0ff]/80">GLXY Radio</p>
        <h1 className="mt-3 text-center text-2xl font-black text-white">Demo login niet actief</h1>
        <p className="mt-3 text-center text-sm font-semibold text-white/70">
          Dit project heeft geen database of NextAuth meer. Bekijk het portaal als statische UI-demo.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#00f0ff]/90 to-[#a855f7]/90 px-4 py-3 text-sm font-black text-[#070b14]"
          >
            Naar dashboard-demo
          </Link>
          <Link href="/" className="inline-flex w-full justify-center rounded-2xl border border-white/20 py-3 text-sm font-black text-white/90 hover:bg-white/5">
            Naar homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
