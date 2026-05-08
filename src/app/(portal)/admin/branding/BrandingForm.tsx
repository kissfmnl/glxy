"use client";

import { updateBrandingAction } from "@/app/actions/glxyBrandingActions";
import { BrandingUploadPick } from "./BrandingUploadPick";
import { useState } from "react";

type Defaults = {
  primaryHex: string;
  accentHex: string;
  navyHex: string;
  yellowHex: string;
  logoUrl: string;
  faviconUrl: string;
  homeHlsUrl: string;
};

const PRESETS = {
  groen: "#0b7557",
  grijs: "#6d6d6d",
  donkergrijs: "#363636",
  geel: "#ffe200",
} as const;

export function BrandingForm({ defaults }: { defaults: Defaults }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [logoUrl, setLogoUrl] = useState(defaults.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(defaults.faviconUrl);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("logoUrl", logoUrl);
        fd.set("faviconUrl", faviconUrl);
        setBusy(true);
        setMsg(null);
        const res = await updateBrandingAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen. Publieke site ververst bij volgende bezoek (cache).");
      }}
      className="card space-y-5 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <div>
        <h2 className="text-lg font-black text-[var(--text-main)]">Kleuren (GLXY)</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Groen, grijs, donkergrijs en geel als CSS-variabelen:{" "}
          <code className="text-[var(--brand-yellow)]">--brand-primary</code>,{" "}
          <code className="text-[var(--brand-yellow)]">--brand-accent</code>,{" "}
          <code className="text-[var(--brand-yellow)]">--brand-navy</code>,{" "}
          <code className="text-[var(--brand-yellow)]">--brand-yellow</code>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.entries(PRESETS) as [string, string][]).map(([name, hex]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/70"
            >
              <span className="h-4 w-4 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: hex }} />
              {name} {hex}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Primair — groen (#hex)
          <input
            name="primaryHex"
            defaultValue={defaults.primaryHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Accent — grijs (#hex)
          <input
            name="accentHex"
            defaultValue={defaults.accentHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Donkergrijs (#hex)
          <input
            name="navyHex"
            defaultValue={defaults.navyHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Geel — accent (#hex)
          <input
            name="yellowHex"
            defaultValue={defaults.yellowHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-lg font-black text-[var(--text-main)]">Logo & favicon</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Upload een bestand (komt in de mediabibliotheek) of plak een externe URL. Voor favicon werkt vierkante PNG of SVG het best.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Logo-URL (header)
            <input
              name="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/api/media/… of https://…"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <BrandingUploadPick label="Upload logo" onUploaded={(url) => setLogoUrl(url)} />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Favicon-URL
            <input
              name="faviconUrl"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="/api/media/… of https://…"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
          <BrandingUploadPick label="Upload favicon" onUploaded={(url) => setFaviconUrl(url)} />
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-lg font-black text-[var(--text-main)]">Homepage livestream (HLS)</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Standaard geluid uit, video speelt gemute mee waar de browser het toelaat.</p>
      </div>
      <label className="block text-xs font-semibold text-[var(--text-muted)]">
        .m3u8 URL
        <input
          name="homeHlsUrl"
          defaultValue={defaults.homeHlsUrl}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-50">
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
        <a
          href="/admin/media"
          className="text-xs font-black text-[var(--brand-yellow)] underline-offset-2 hover:underline"
        >
          Open mediabibliotheek
        </a>
        {msg ? <p className="text-sm font-semibold text-[var(--brand-primary)]">{msg}</p> : null}
      </div>
    </form>
  );
}
