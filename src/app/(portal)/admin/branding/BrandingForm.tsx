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
  navItems: Array<{ href: string; label: string }>;
  instagramUrl: string;
  tiktokUrl: string;
  menuBarHex: string;
  heroVideoFrameHex: string;
  listenBarBgHex: string;
  listenBarTextHex: string;
  stationColors: Record<string, string>;
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
  const [navItems, setNavItems] = useState<Array<{ href: string; label: string }>>(defaults.navItems ?? []);
  const [instagramUrl, setInstagramUrl] = useState(defaults.instagramUrl ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(defaults.tiktokUrl ?? "");
  const [menuBarHex, setMenuBarHex] = useState(defaults.menuBarHex ?? "");
  const [heroVideoFrameHex, setHeroVideoFrameHex] = useState(defaults.heroVideoFrameHex ?? "");
  const [listenBarBgHex, setListenBarBgHex] = useState(defaults.listenBarBgHex ?? "");
  const [listenBarTextHex, setListenBarTextHex] = useState(defaults.listenBarTextHex ?? "");
  const [stationColors, setStationColors] = useState<Record<string, string>>(defaults.stationColors ?? {});

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("logoUrl", logoUrl);
        fd.set("faviconUrl", faviconUrl);
        fd.set("navItemsJson", JSON.stringify(navItems));
        fd.set("instagramUrl", instagramUrl);
        fd.set("tiktokUrl", tiktokUrl);
        fd.set("menuBarHex", menuBarHex);
        fd.set("heroVideoFrameHex", heroVideoFrameHex);
        fd.set("listenBarBgHex", listenBarBgHex);
        fd.set("listenBarTextHex", listenBarTextHex);
        fd.set("stationColorsJson", JSON.stringify(stationColors));
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
          Upload een bestand (mediabibliotheek) of plak een URL. <strong className="font-semibold text-[var(--text-main)]">Let op bij deploy:</strong> paden als{" "}
          <code className="text-[var(--brand-yellow)]">/api/media/…</code> wijzen naar bestanden op de server. Zonder persistent schijf-volume (zoals Railway met{" "}
          <code className="text-[var(--brand-yellow)]">WEBSITE_FILES_ROOT</code>) gaan die uploads bij een nieuwe deploy vaak verloren — dan zie je de fallback-placeholder in plaats van jouw logo. Gebruik een bestand in{" "}
          <code className="text-[var(--brand-yellow)]">public/</code> (in git gecommit, bv. <code className="text-[var(--brand-yellow)]">/mijn-logo.png</code>) of een vaste externe CDN-URL voor een stabiel logo.
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
        <h2 className="text-lg font-black text-[var(--text-main)]">Social icons</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Deze links worden gebruikt voor de iconen in de header.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Instagram URL
          <input
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/…"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          TikTok URL
          <input
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://tiktok.com/…"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)] md:col-span-2">
          Menubalk kleur (#hex)
          <input
            value={menuBarHex}
            onChange={(e) => setMenuBarHex(e.target.value)}
            placeholder={defaults.primaryHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
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

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-lg font-black text-[var(--text-main)]">Homepage — videokader</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Accentkleur rond de homepage-video. Leeg laten = standaard GLXY-geel (#ffe200). Onderstaande balk-kleuren zijn optioneel (CSS-variabelen; het label “Luister naar” staat niet meer op de site).
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Video — accent / gloed (#hex)
          <input
            value={heroVideoFrameHex}
            onChange={(e) => setHeroVideoFrameHex(e.target.value)}
            placeholder="#ffe200"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Balk “Luister naar” — achtergrond (#hex)
          <input
            value={listenBarBgHex}
            onChange={(e) => setListenBarBgHex(e.target.value)}
            placeholder={defaults.primaryHex}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          Balk — tekst (#hex)
          <input
            value={listenBarTextHex}
            onChange={(e) => setListenBarTextHex(e.target.value)}
            placeholder="#ffffff"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
          />
        </label>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-lg font-black text-[var(--text-main)]">Zenders (kleuren)</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Alleen kleuren voor de zenderkaarten links op de homepage. Gebruik hex (bijv. <code className="text-[var(--brand-yellow)]">#e11d48</code>).
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {["z1", "z2", "z3", "z4"].map((id) => (
          <label key={id} className="block text-xs font-semibold text-[var(--text-muted)]">
            {id.toUpperCase()} kleur
            <input
              value={stationColors[id] ?? ""}
              onChange={(e) => setStationColors((prev) => ({ ...prev, [id]: e.target.value }))}
              placeholder="#000000"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
            />
          </label>
        ))}
      </div>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-lg font-black text-[var(--text-main)]">Publiek menu</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Bepaal zelf de volgorde. Dit menu wordt bovenaan de publieke site getoond.
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid gap-2">
          {navItems.map((it, idx) => (
            <div key={`${it.href}-${idx}`} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_1.2fr_auto] md:items-center">
              <label className="block text-[11px] font-black uppercase tracking-wider text-white/60">
                Label
                <input
                  value={it.label}
                  onChange={(e) =>
                    setNavItems((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                  }
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm font-black text-white outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30"
                />
              </label>
              <label className="block text-[11px] font-black uppercase tracking-wider text-white/60">
                Link (href)
                <input
                  value={it.href}
                  onChange={(e) =>
                    setNavItems((prev) => prev.map((x, i) => (i === idx ? { ...x, href: e.target.value } : x)))
                  }
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-black text-white/85 hover:bg-white/10 disabled:opacity-40"
                  disabled={idx === 0}
                  onClick={() =>
                    setNavItems((prev) => {
                      const copy = [...prev];
                      const tmp = copy[idx - 1]!;
                      copy[idx - 1] = copy[idx]!;
                      copy[idx] = tmp;
                      return copy;
                    })
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-black text-white/85 hover:bg-white/10 disabled:opacity-40"
                  disabled={idx === navItems.length - 1}
                  onClick={() =>
                    setNavItems((prev) => {
                      const copy = [...prev];
                      const tmp = copy[idx + 1]!;
                      copy[idx + 1] = copy[idx]!;
                      copy[idx] = tmp;
                      return copy;
                    })
                  }
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 hover:bg-red-500/15"
                  onClick={() => setNavItems((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Verwijder
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="rounded-xl bg-[var(--brand-primary)]/20 px-4 py-2.5 text-xs font-black text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/28"
          onClick={() => setNavItems((prev) => [...prev, { href: "/", label: "Nieuw" }])}
        >
          + Menu-item toevoegen
        </button>
      </div>

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
