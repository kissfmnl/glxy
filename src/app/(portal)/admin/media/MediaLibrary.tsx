"use client";

import {
  applyMediaToBrandingAction,
  deleteMediaAssetAction,
  uploadMediaAssetAction,
} from "@/app/actions/mediaActions";
import AppImage from "@/components/AppImage";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type MediaRow = {
  id: string;
  filename: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ initial, listError }: { initial: MediaRow[]; listError?: string | null }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadMediaAssetAction(fd);
      if (res?.error) {
        setUploadMsg(res.error);
        return;
      }
      if (res?.ok && res.url && res.id) {
        const url = res.url;
        setItems((prev) => [
          {
            id: res.id as string,
            filename: file.name,
            publicUrl: url,
            mimeType: file.type || "image/*",
            sizeBytes: file.size,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setUploadMsg("Geüpload.");
        router.refresh();
        return;
      }
      setUploadMsg("Upload mislukt (geen resultaat teruggekregen).");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadMsg(msg || "Upload mislukt.");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Bestand verwijderen? Links naar deze URL breken.")) return;
    setBusyId(id);
    const res = await deleteMediaAssetAction(id);
    setBusyId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
    router.refresh();
  }

  async function applyBrand(field: "logo" | "favicon", mediaId: string) {
    setBusyId(mediaId);
    const res = await applyMediaToBrandingAction(mediaId, field);
    setBusyId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    setUploadMsg(field === "logo" ? "Logo bijgewerkt op de publieke site." : "Favicon bijgewerkt.");
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      setUploadMsg("URL gekopieerd.");
    } catch {
      setUploadMsg(url);
    }
  }

  return (
    <div className="space-y-8">
      {listError ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{listError}</div>
      ) : null}
      <section className="card border border-white/10 bg-white/[0.04] backdrop-blur">
        <h2 className="text-lg font-black text-[var(--text-main)]">Upload</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Afbeeldingen tot 10 MB (jpg, png, gif, webp, svg). Bestanden staan op de server onder{" "}
          <code className="text-[var(--brand-yellow)]">Website/media/</code>.
        </p>
        <label
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-black/20 px-6 py-10 transition-colors hover:border-[var(--brand-primary)]/60"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (uploading) return;
            onUpload(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => onUpload(e.target.files)}
          />
          <span className="text-sm font-black text-[var(--brand-primary)]">
            {uploading ? "Bezig…" : "Klik of sleep een bestand hierheen"}
          </span>
          <span className="mt-1 text-xs text-[var(--text-muted)]">Één bestand per keer</span>
        </label>
        {uploadMsg ? <p className="mt-3 text-sm font-semibold text-[var(--brand-yellow)]">{uploadMsg}</p> : null}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-black text-[var(--text-main)]">Bibliotheek ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nog geen uploads.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <li
                key={m.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-lg"
              >
                <div className="relative aspect-video bg-black/50">
                  {m.mimeType.includes("svg") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.publicUrl} alt="" className="h-full w-full object-contain p-4" />
                  ) : (
                    <AppImage
                      src={m.publicUrl}
                      alt=""
                      width={640}
                      height={360}
                      className="h-full w-full object-contain p-2"
                    />
                  )}
                </div>
                <div className="space-y-2 border-t border-white/10 p-3">
                  <p className="truncate text-xs font-semibold text-white" title={m.filename}>
                    {m.filename}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {fmtSize(m.sizeBytes)} · {m.mimeType}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="rounded-lg bg-[var(--brand-primary)]/25 px-2 py-1 text-[10px] font-black text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/35"
                      disabled={busyId === m.id}
                      onClick={() => applyBrand("logo", m.id)}
                    >
                      → Logo
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black text-white/85 hover:bg-white/15"
                      disabled={busyId === m.id}
                      onClick={() => applyBrand("favicon", m.id)}
                    >
                      → Favicon
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-black text-[var(--brand-yellow)] hover:bg-white/5"
                      onClick={() => copyUrl(m.publicUrl)}
                    >
                      Kopieer URL
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-500/30 px-2 py-1 text-[10px] font-black text-red-300 hover:bg-red-500/10"
                      disabled={busyId === m.id}
                      onClick={() => onDelete(m.id)}
                    >
                      Verwijder
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
