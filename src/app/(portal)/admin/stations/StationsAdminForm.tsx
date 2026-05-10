"use client";

import { updateStationsAction } from "@/app/actions/stationsAdminActions";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { BrandingUploadPick } from "../branding/BrandingUploadPick";
import { glxyChannelHeading, KEEP_STATION_LOGO, type GlxyStationInput } from "@/lib/glxyStations";
import { useEffect, useState } from "react";

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

  const [crop, setCrop] = useState<{ stationId: string; src: string } | null>(null);

  useEffect(() => {
    return () => {
      if (crop?.src.startsWith("blob:")) URL.revokeObjectURL(crop.src);
    };
  }, [crop]);

  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("stationColorsJson", JSON.stringify(stationColors));
          fd.set(
            "stationsJson",
            JSON.stringify(
              stations.map((s) => ({
                id: s.id,
                line1: s.line1,
                line2: s.line2,
                streamUrl: s.streamUrl,
                logoUrl:
                  s.logoUrl.trim() ||
                  (defaults.stationsLogoEmbedded[s.id] ? KEEP_STATION_LOGO : ""),
                nowPlayingUrl: s.nowPlayingUrl,
                playButtonHex: s.playButtonHex,
                ...(s.offAir ? { offAir: true } : {}),
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-black text-[var(--text-main)]">Per kanaal</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Volgorde = homepage-volgorde. Off-air = verborgen op de site. Stream, metadata-URL, fallbacks, logo, kleuren.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl bg-[var(--brand-primary)]/20 px-4 py-2 text-xs font-black text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/28"
              onClick={() =>
                setStations((prev) => [
                  ...prev,
                  {
                    id: `ch_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
                    line1: "GLXY Radio",
                    line2: "—",
                    streamUrl: "",
                    logoUrl: "",
                    nowPlayingUrl: "",
                    playButtonHex: "",
                    offAir: false,
                  },
                ])
              }
            >
              + Zender toevoegen
            </button>
            <a
              href="/admin/media"
              className="text-xs font-black text-[var(--brand-yellow)] underline-offset-2 hover:underline"
            >
              Mediabibliotheek
            </a>
          </div>
        </div>

        <div className="grid gap-8">
          {stations.map((s, idx) => {
            const previewSrc =
              s.logoUrl.trim()
                ? s.logoUrl.trim()
                : defaults.stationsLogoEmbedded[s.id]
                  ? `/api/admin/station-branding-logo?id=${encodeURIComponent(s.id)}`
                  : "";

            return (
              <section
                key={s.id}
                className="rounded-2xl border border-white/12 bg-black/25 p-4 shadow-inner sm:p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-black tracking-tight text-[var(--text-main)]">
                      {glxyChannelHeading(s.id, idx)}
                    </h3>
                    <span className="font-mono text-[10px] font-semibold uppercase text-[var(--text-muted)]">{s.id}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                      <input
                        type="checkbox"
                        checked={s.offAir === true}
                        onChange={(e) =>
                          setStations((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, offAir: e.target.checked } : x)),
                          )
                        }
                      />
                      Off-air
                    </label>
                    <button
                      type="button"
                      className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs font-black text-white hover:bg-white/15 disabled:opacity-35"
                      disabled={idx === 0}
                      onClick={() =>
                        setStations((prev) => {
                          const n = [...prev];
                          const t = n[idx - 1]!;
                          n[idx - 1] = n[idx]!;
                          n[idx] = t;
                          return n;
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs font-black text-white hover:bg-white/15 disabled:opacity-35"
                      disabled={idx === stations.length - 1}
                      onClick={() =>
                        setStations((prev) => {
                          const n = [...prev];
                          const t = n[idx + 1]!;
                          n[idx + 1] = n[idx]!;
                          n[idx] = t;
                          return n;
                        })
                      }
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-500/35 bg-red-500/10 px-2 py-1 text-xs font-black text-red-200 hover:bg-red-500/15"
                      onClick={() => {
                        if (!confirm(`Zender ${s.id} verwijderen?`)) return;
                        setStations((prev) => prev.filter((_, i) => i !== idx));
                        setStationColors((prev) => {
                          const n = { ...prev };
                          delete n[s.id];
                          return n;
                        });
                      }}
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[140px_1fr]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-2xl bg-black/35 ring-2 ring-white/15">
                      {previewSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element -- dynamische admin-preview (data URL / extern)
                        <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-center text-[10px] font-semibold text-white/50">
                          Geen logo
                        </div>
                      )}
                    </div>
                    <BrandingUploadPick
                      label="Upload"
                      onUploaded={(url) =>
                        setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, logoUrl: url } : x)))
                      }
                    />
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/85 hover:bg-white/10">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (!f) return;
                          const src = URL.createObjectURL(f);
                          setCrop({ stationId: s.id, src });
                        }}
                      />
                      Nieuw bestand…
                    </label>
                    {previewSrc ? (
                      <button
                        type="button"
                        className="text-center text-[10px] font-black uppercase tracking-wide text-[var(--brand-yellow)] underline-offset-2 hover:underline"
                        onClick={async () => {
                          try {
                            const res = await fetch(previewSrc);
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            setCrop({ stationId: s.id, src: url });
                          } catch {
                            /* CORS of netwerk — gebruik upload */
                          }
                        }}
                      >
                        Huidige logo bijsnijden
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-[var(--text-muted)] sm:col-span-2">
                      Stream-URL
                      <input
                        value={s.streamUrl}
                        onChange={(e) =>
                          setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, streamUrl: e.target.value } : x)))
                        }
                        placeholder="https://…"
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] sm:col-span-2">
                      Nu speelt — tekstbestand (URL)
                      <input
                        value={s.nowPlayingUrl}
                        onChange={(e) =>
                          setStations((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, nowPlayingUrl: e.target.value } : x)),
                          )
                        }
                        placeholder="https://…/status.xsl of .txt"
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                      />
                    </label>
                    <p className="sm:col-span-2 text-[11px] leading-snug text-[var(--text-muted)]">
                      Eerste regel = <strong className="text-[var(--text-main)]">titel</strong>, tweede regel ={" "}
                      <strong className="text-[var(--text-main)]">artiest</strong>. Eén regel met &quot;Artiest - Titel&quot; wordt automatisch gesplitst.
                    </p>
                    <label className="block text-xs font-semibold text-[var(--text-muted)]">
                      Fallback titel
                      <input
                        value={s.line1}
                        onChange={(e) =>
                          setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, line1: e.target.value } : x)))
                        }
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm font-black text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[var(--text-muted)]">
                      Fallback artiest / regel 2
                      <input
                        value={s.line2}
                        onChange={(e) =>
                          setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, line2: e.target.value } : x)))
                        }
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[var(--text-muted)]">
                      Kaart — achtergrondkleur
                      <input
                        value={stationColors[s.id] ?? ""}
                        onChange={(e) => setStationColors((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="#hex"
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[var(--text-muted)]">
                      Playknop — icoonkleur
                      <input
                        value={s.playButtonHex}
                        onChange={(e) =>
                          setStations((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, playButtonHex: e.target.value } : x)),
                          )
                        }
                        placeholder="Leeg = standaard thema"
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] sm:col-span-2">
                      Logo-URL (optioneel, overschrijft upload)
                      <input
                        value={s.logoUrl}
                        onChange={(e) =>
                          setStations((prev) => prev.map((x, i) => (i === idx ? { ...x, logoUrl: e.target.value } : x)))
                        }
                        placeholder="/api/media/… of https://…"
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs text-white outline-none ring-[var(--brand-primary)]/30 focus:ring-2"
                      />
                    </label>
                  </div>
                </div>

                {defaults.stationsLogoEmbedded[s.id] && !s.logoUrl.trim() ? (
                  <p className="mt-3 text-[11px] font-semibold text-[var(--brand-primary)]">
                    Logo staat ingesloten in de database — upload of URL om te vervangen.
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <button type="submit" disabled={busy} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-50">
            {busy ? "Opslaan…" : "Alles opslaan"}
          </button>
          {msg ? <p className="text-sm font-semibold text-[var(--brand-primary)]">{msg}</p> : null}
        </div>
      </form>

      {crop ? (
        <ImageCropModal
          imageSrc={crop.src}
          title={`Logo bijsnijden — ${glxyChannelHeading(crop.stationId, stations.findIndex((x) => x.id === crop.stationId))}`}
          onClose={() => {
            if (crop.src.startsWith("blob:")) URL.revokeObjectURL(crop.src);
            setCrop(null);
          }}
          onCroppedUrl={(url) => {
            setStations((prev) =>
              prev.map((x) => (x.id === crop.stationId ? { ...x, logoUrl: url } : x)),
            );
          }}
        />
      ) : null}
    </>
  );
}
