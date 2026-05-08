"use client";

import { useFormStatus } from "react-dom";

export function ConcertSyncSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[#1e375a] py-3 text-sm font-black text-white shadow-md transition-colors hover:bg-[#2a4a73] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sync bezig..." : "Nu syncen"}
    </button>
  );
}
