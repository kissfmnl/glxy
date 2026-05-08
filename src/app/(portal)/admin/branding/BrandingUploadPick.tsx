"use client";

import { uploadMediaAssetAction } from "@/app/actions/mediaActions";
import { useState } from "react";

export function BrandingUploadPick({
  label,
  onUploaded,
}: {
  label: string;
  onUploaded: (publicUrl: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/10 px-3 py-2 text-xs font-black text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr(null);
            const fd = new FormData();
            fd.set("file", f);
            const res = await uploadMediaAssetAction(fd);
            setBusy(false);
            if (res.error) {
              setErr(res.error);
              return;
            }
            if (res.url) onUploaded(res.url);
          }}
        />
        {busy ? "Uploaden…" : label}
      </label>
      {err ? <p className="text-[11px] font-semibold text-red-300">{err}</p> : null}
    </div>
  );
}
