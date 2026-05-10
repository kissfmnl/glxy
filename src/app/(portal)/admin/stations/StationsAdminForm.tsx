"use client";

import { updateStationsAction } from "@/app/actions/stationsAdminActions";
import { KEEP_STATION_LOGO } from "@/lib/glxyStations";
import type { GlxyStationInput } from "@/lib/glxyStations";
import { BrandingUploadPick } from "../branding/BrandingUploadPick";
import { useState } from "react";

type Defaults = {
  stations: GlxyStationInput[];
  stationsLogoEmbedded: Record<string, boolean>;
  stationColors: Record<string, string>;
};

export function StationsAdminForm({ defaults }: { defaults: Defaults }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stationColors, setStationColors] = useState<Record<string, string>>(defaults.stationColors ?? {});
  const [stations, setStations] = useState<GlxyStationInput[]>(defaults.stations ?? []);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("stationColorsJson", JSON.stringify(stationColors));
        fd.set(
          "stationsJson",
          JSON.stringify(
            stations.map((s) => ({
              ...s,
              logoUrl:
                s.logoUrl.trim() ||
                (defaults.stationsLogoEmbedded[s.id] ? KEEP_STATION_LOGO : ""),
            })),
          ),
        );
        setBusy(true);
        setMsg(null);
        const res = await updateStationsAction(fd);
        setBusy(false);
        if (res.error) setMsg(res.error);
        else setMsg("Opgeslagen.");
      }}
      className="card space-y-8 border border-white/10 bg-white/[0.04] backdrop-blur"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-black text-[var(--text-main)]">Zenders op de homepage</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Naam, subtitel, stream en optioneel logo. Voor &quot;nu speelt&quot;: een publieke <strong className="text-[var(--text-main)]">http(s)-URL</strong> naar een{" "}
          <strong className="text-[var(--text-main)]">plat tekstbestand</strong> (eerste regel wordt getoond zolang deze zender speelt). Bij uploads vanaf{" "}
          <code className="text-[var(--brand-yellow)]">/api/media/</code> worden logo&apos;s net als bij Huisstijl in de database ingesloten.
        </p>
        <div className="grid gap-4">
          {stations.map((s, idx) => (
            <div key={s.id} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--brand-yellow)]">{s.id}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-xs font-semibold text-[var(--text-muted)]">
                  Radionaam
                  <input
                    value={s.line1}
                    onChange={(e) =>
                      setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, line1: e.target.value } : x)))
                    }
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm font-black text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                  />
                </label>
                <label className="block text-xs font-semibold text-[var(--text-muted)]">
                  Subtitel
                  <input
                    value={s.line2}
                    onChange={(e) =>
                      setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, line2: e.target.value } : x)))
                    }
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                  />
                </label>
                <label className="block text-xs font-semibold text-[var(--text-muted)] md:col-span-2">
                  Stream-URL
                  <input
                    value={s.streamUrl}
                    onChange={(e) =>
                      setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, streamUrl: e.target.value } : x)))
                    }
                    placeholder="https://…"
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                  />
                </label>
                <label className="block text-xs font-semibold text-[var(--text-muted)] md:col-span-2">
                  Nu speelt — tekstbestand (URL, optioneel)
                  <input
                    value={s.nowPlayingUrl}
                    onChange={(e) =>
                      setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, nowPlayingUrl: e.target.value } : x)))
                    }
                    placeholder="https://…/currentsong.txt"
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                  />
                </label>
                <label className="block text-xs font-semibold text-[var(--text-muted)] md:col-span-2">
                  Logo-URL (optioneel)
                  <input
                    value={s.logoUrl}
                    onChange={(e) =>
                      setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, logoUrl: e.target.value } : x)))
                    }
                    placeholder="/api/media/… of https://…"
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                  />
                </label>
              </div>
              {defaults.stationsLogoEmbedded[s.id] && !s.logoUrl.trim() ? (
                <p className="text-[11px] font-semibold text-[var(--brand-primary)]">Logo ingesloten — upload om te vervangen.</p>
              ) : null}
              <BrandingUploadPick
                label={`Upload logo (${s.id})`}
                onUploaded={(url) =>
                  setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, logoUrl: url } : x)))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-t border-white/10 pt-8">
        <h2 className="text-lg font-black text-[var(--text-main)]">Kaartkleuren</h2>
        <p className="text-sm text-[var(--text-muted)]">Achtergrond per zender (hex). Leeg laten gebruikt de standaard uit het thema.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {["z1", "z2", "z3", "z4"].map((id) => (
            <label key={id} className="block text-xs font-semibold text-[var(--text-muted)]">
              {id.toUpperCase()}
              <input
                value={stationColors[id] ?? ""}
                onChange={(e) => setStationColors((prev) => ({ ...prev, [id]: e.target.value }))}
                placeholder="#000000"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
        <button type="submit" disabled={busy} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-50">
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
        <a
          href="/admin/media"
          className="text-xs font-black text-[var(--brand-yellow)] underline-offset-2 hover:underline"
        >
          Mediabibliotheek
        </a>
        {msg ? <p className="text-sm font-semibold text-[var(--brand-primary)]">{msg}</p> : null}
      </div>
    </form>
  );
}
