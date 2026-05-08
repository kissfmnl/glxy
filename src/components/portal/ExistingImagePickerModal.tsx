"use client";

import { useMemo, useState } from "react";
import AppImage from "@/components/AppImage";

function assetSrc(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  return "/api/assets/" + imagePath.split("/").map(encodeURIComponent).join("/");
}

export function ExistingImagePickerModal({
  name,
  files,
  selected,
  buttonLabel,
}: {
  name: string;
  files: string[];
  selected: string;
  buttonLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selected);
  const selectedLabel = useMemo(() => {
    if (!value) return "Niet ingesteld";
    return value.split("/").pop() || value;
  }, [value]);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:border-brand-primary/40"
      >
        {buttonLabel}
      </button>
      <p className="text-[11px] font-bold text-gray-500">Gekozen: {selectedLabel}</p>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-gray-900">Kies een foto</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
                aria-label="Sluiten"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
              <label className="mb-2 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold">
                <input
                  type="radio"
                  checked={value === ""}
                  onChange={() => setValue("")}
                  className="accent-brand-primary"
                />
                Niet ingesteld
              </label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {files.map((f) => {
                  const src = assetSrc(f);
                  const active = value === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setValue(f)}
                      className={`overflow-hidden rounded-lg border bg-white p-1.5 text-left ${
                        active ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-gray-200"
                      }`}
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-md bg-black/5">
                        {src ? <AppImage src={src} alt={f} className="h-full w-full object-cover" loading="lazy" /> : null}
                      </div>
                      <p className="mt-1 truncate text-[10px] font-bold text-gray-600" title={f}>
                        {f}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white"
              >
                Klaar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
