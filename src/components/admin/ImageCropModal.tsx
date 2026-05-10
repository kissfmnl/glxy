"use client";

import { uploadMediaAssetAction } from "@/app/actions/mediaActions";
import { cropImageToBlob } from "@/lib/cropImageToBlob";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  imageSrc: string;
  onClose: () => void;
  onCroppedUrl: (publicUrl: string) => void;
  title?: string;
};

export function ImageCropModal({ imageSrc, onClose, onCroppedUrl, title = "Snijd logo bij" }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onCropComplete = useCallback((_a: Area, b: Area) => {
    setCroppedAreaPixels(b);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0c1f33] shadow-2xl">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-[11px] text-white/65">Sleep en zoom; vierkant voor de zenderkaart.</p>
        </div>
        <div className="relative flex-1 bg-black/40" style={{ height: 280 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="space-y-2 border-t border-white/10 px-4 py-3">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[var(--brand-primary)]"
            />
          </label>
          {err ? <p className="text-[11px] font-semibold text-red-300">{err}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
              onClick={onClose}
              disabled={busy}
            >
              Annuleren
            </button>
            <button
              type="button"
              className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-xs font-black text-white hover:opacity-95 disabled:opacity-50"
              disabled={busy || !croppedAreaPixels}
              onClick={async () => {
                if (!croppedAreaPixels) return;
                setBusy(true);
                setErr(null);
                try {
                  const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, "image/jpeg");
                  const file = new File([blob], "station-logo.jpg", { type: "image/jpeg" });
                  const fd = new FormData();
                  fd.set("file", file);
                  const res = await uploadMediaAssetAction(fd);
                  if (res?.error) {
                    setErr(res.error);
                    return;
                  }
                  if (res?.url) {
                    onCroppedUrl(res.url);
                    onClose();
                  } else setErr("Upload mislukt.");
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Bijsnijden mislukt.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Bezig…" : "Gebruik uitsnede"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
