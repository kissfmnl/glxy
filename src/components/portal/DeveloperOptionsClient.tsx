"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateMockMessagesPreference } from "@/app/actions/developerOptionsActions";
import { AlbumCoverDebugPanel } from "@/components/portal/AlbumCoverDebugPanel";

export function DeveloperOptionsClient({ initialShowMock }: { initialShowMock: boolean }) {
  const { update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateMockMessagesPreference(formData);
    if (result.success) {
      setStatus({ success: true });
      await update();
      router.refresh();
    } else {
      setStatus({ error: result.error });
    }
    setLoading(false);
  }

  return (
    <form key={initialShowMock ? "mock-on" : "mock-off"} onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Mock WhatsApp berichten</h2>
          <p className="mt-1 text-[11px] font-medium text-gray-500 dark:text-white/50">
            Toon gesimuleerde berichten in de inbox (alleen voor demo/test).
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            name="showMockMessages"
            type="checkbox"
            defaultChecked={initialShowMock}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-primary peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-gray-700 dark:after:border-gray-600 rtl:peer-checked:after:-translate-x-full" />
        </label>
      </div>

      {status?.success ? (
        <p className="text-sm font-bold text-green-600 dark:text-green-400">Opgeslagen.</p>
      ) : null}
      {status?.error ? <p className="text-sm font-bold text-red-500">{status.error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-brand-primary py-4 text-sm font-black text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 disabled:opacity-50"
      >
        {loading ? "Opslaan…" : "Opslaan"}
      </button>

      <AlbumCoverDebugPanel />
    </form>
  );
}
