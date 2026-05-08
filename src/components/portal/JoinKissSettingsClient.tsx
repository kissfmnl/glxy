"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  saveJoinKissBenefits,
  saveJoinKissVacancies,
  seedJoinKissDefaults,
  type JoinKissVacancyPayload,
} from "@/app/actions/joinKissActions";
import { JOIN_KISS_SLOT_LABELS, JOIN_KISS_SLOTS, type JoinKissSlot } from "@/lib/joinKissDefaults";
import { websiteAssetUrl } from "@/lib/websiteAssetUrl";

export type VacRowState = {
  slot: JoinKissSlot;
  title: string;
  category: string;
  location: string;
  jobType: string;
  imagePath: string;
  description: string;
  requirements: string;
  applyLabel: string;
  applyUrl: string;
  isActive: boolean;
  imageFile?: File | null;
};

export function JoinKissSettingsClient({
  initialVacancies,
  initialBenefits,
  hasDbVacancies,
  hasDbBenefits,
  selectableImages,
}: {
  initialVacancies: VacRowState[];
  initialBenefits: { title: string; body: string }[];
  hasDbVacancies: boolean;
  hasDbBenefits: boolean;
  selectableImages: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [vacancies, setVacancies] = useState<VacRowState[]>(initialVacancies);
  const [benefits, setBenefits] = useState<{ title: string; body: string }[]>(initialBenefits);
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null);

  function updateVac(slot: JoinKissSlot, patch: Partial<VacRowState>) {
    setVacancies((rows) => rows.map((r) => (r.slot === slot ? { ...r, ...patch } : r)));
  }

  function saveAll() {
    setMsg(null);
    start(async () => {
      try {
        const payload = {} as Record<JoinKissSlot, JoinKissVacancyPayload>;
        for (const r of vacancies) {
          let imagePath = r.imagePath;
          if (r.imageFile) {
            const fd = new FormData();
            fd.set("slot", r.slot);
            fd.set("file", r.imageFile);
            const res = await fetch("/api/join-kiss/upload-image", { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Upload mislukt.");
            imagePath = String(json?.imagePath || "").trim();
            if (!imagePath) throw new Error("Upload mislukt.");
          }
          payload[r.slot] = {
            title: r.title,
            category: r.category,
            location: r.location,
            jobType: r.jobType,
            imagePath,
            description: r.description,
            requirements: r.requirements,
            applyLabel: r.applyLabel,
            applyUrl: r.applyUrl,
            isActive: r.isActive,
          };
        }
        await saveJoinKissVacancies(payload);
        await saveJoinKissBenefits(benefits);
        setMsg({ ok: "Opgeslagen." });
        router.refresh();
      } catch (e) {
        setMsg({ err: e instanceof Error ? e.message : "Opslaan mislukt." });
      }
    });
  }

  function seed() {
    setMsg(null);
    start(async () => {
      try {
        await seedJoinKissDefaults();
        setMsg({ ok: "Standaardteksten geladen. Controleer de velden en sla op." });
        router.refresh();
      } catch (e) {
        setMsg({ err: e instanceof Error ? e.message : "Initialiseren mislukt." });
      }
    });
  }

  return (
    <div className="space-y-10">
      <div className="sticky top-2 z-30 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-[#1a1f2e]/95">
        <button
          type="button"
          disabled={pending}
          onClick={saveAll}
          className="w-full rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-primary/25 transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {pending ? "Opslaan…" : "Alles opslaan"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-white/65">
          Teksten boven de pagina kun je ook aanpassen onder{" "}
          <Link href="/settings/website-teksten" className="font-black text-brand-primary hover:underline">
            Website-teksten (tab Join KISS)
          </Link>
          .
        </p>
        {!hasDbVacancies || !hasDbBenefits ? (
          <button
            type="button"
            disabled={pending}
            onClick={seed}
            className="rounded-full border border-[#1e375a]/25 bg-white px-4 py-2 text-xs font-black text-[#1e375a] transition-colors hover:bg-[#f4f8fb] dark:border-white/20 dark:bg-white/5 dark:text-white"
          >
            Vul standaardteksten (database leeg)
          </button>
        ) : null}
      </div>

      {msg?.ok ? (
        <p className="rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-700 dark:text-green-400">
          {msg.ok}
        </p>
      ) : null}
      {msg?.err ? (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-400">
          {msg.err}
        </p>
      ) : null}

      <div className="space-y-8">
        {vacancies.map((r) => (
          <div
            key={r.slot}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                Vacature: {JOIN_KISS_SLOT_LABELS[r.slot]}
              </h2>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-white/70">
                <input
                  type="checkbox"
                  checked={r.isActive}
                  onChange={(e) => updateVac(r.slot, { isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Tonen op de site
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Titel</span>
                <input
                  value={r.title}
                  onChange={(e) => updateVac(r.slot, { title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Categorie</span>
                <input
                  value={r.category}
                  onChange={(e) => updateVac(r.slot, { category: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Locatie</span>
                <input
                  value={r.location}
                  onChange={(e) => updateVac(r.slot, { location: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Dienstverband</span>
                <input
                  value={r.jobType}
                  onChange={(e) => updateVac(r.slot, { jobType: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <div className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Vacature afbeelding</span>
                {r.imagePath?.trim() && websiteAssetUrl(r.imagePath) ? (
                  <div className="mb-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2">
                    <img
                      src={`${websiteAssetUrl(r.imagePath) || ""}?v=${encodeURIComponent((r.imagePath || "").trim())}`}
                      alt={`Vacature ${JOIN_KISS_SLOT_LABELS[r.slot]}`}
                      className="h-12 w-20 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => updateVac(r.slot, { imagePath: "", imageFile: null })}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-700"
                    >
                      Verwijderen
                    </button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => updateVac(r.slot, { imageFile: e.target.files?.[0] ?? null })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <p className="mt-1 text-[10px] font-bold text-gray-500">
                  Gebruik bij voorkeur JPG of PNG (werkt het meest betrouwbaar op iPhone en oudere toestellen).
                </p>
                <select
                  value={r.imagePath}
                  onChange={(e) => updateVac(r.slot, { imagePath: e.target.value, imageFile: null })}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <option value="">Of kies bestaande afbeelding</option>
                  {selectableImages.map((img) => (
                    <option key={`join-${r.slot}-${img}`} value={img}>{img}</option>
                  ))}
                </select>
              </div>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Knoptekst</span>
                <input
                  value={r.applyLabel}
                  onChange={(e) => updateVac(r.slot, { applyLabel: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="sm:col-span-2 block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">
                  Sollicitatielink (mailto: of https://)
                </span>
                <input
                  value={r.applyUrl}
                  onChange={(e) => updateVac(r.slot, { applyUrl: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="sm:col-span-2 block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Omschrijving</span>
                <textarea
                  value={r.description}
                  onChange={(e) => updateVac(r.slot, { description: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="sm:col-span-2 block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">
                  Vereisten (één per regel)
                </span>
                <textarea
                  value={r.requirements}
                  onChange={(e) => updateVac(r.slot, { requirements: e.target.value })}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Voordelen (kaarten)</h2>
          <button
            type="button"
            onClick={() => setBenefits((b) => [...b, { title: "", body: "" }])}
            className="rounded-full bg-[#1e375a] px-4 py-2 text-xs font-black text-white hover:bg-[#2a4a73]"
          >
            Kaart toevoegen
          </button>
        </div>
        <div className="space-y-4">
          {benefits.map((b, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setBenefits((rows) => rows.filter((_, j) => j !== i))}
                  className="text-xs font-black text-red-600 hover:underline"
                >
                  Verwijderen
                </button>
              </div>
              <label className="mb-2 block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Titel</span>
                <input
                  value={b.title}
                  onChange={(e) =>
                    setBenefits((rows) => rows.map((row, j) => (j === i ? { ...row, title: e.target.value } : row)))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-400">Tekst</span>
                <textarea
                  value={b.body}
                  onChange={(e) =>
                    setBenefits((rows) => rows.map((row, j) => (j === i ? { ...row, body: e.target.value } : row)))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={saveAll}
        className="rounded-2xl bg-brand-primary px-8 py-4 font-black text-white shadow-lg shadow-brand-primary/20 transition-opacity hover:opacity-95 disabled:opacity-50"
      >
        {pending ? "Opslaan…" : "Alles opslaan"}
      </button>
    </div>
  );
}
