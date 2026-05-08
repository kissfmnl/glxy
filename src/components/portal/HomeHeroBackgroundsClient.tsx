"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeHomeHeroBackground, uploadHomeHeroBackground } from "@/app/actions/homeHeroBackgroundActions";

function assetUrl(rel: string) {
  return "/api/assets/" + rel.split("/").map(encodeURIComponent).join("/");
}

export function HomeHeroBackgroundsClient({
  initialPaths,
  className = "",
  embedded = false,
}: {
  initialPaths: string[];
  /** bv. mt-0 wanneer ingebed op de site-inhoudpagina */
  className?: string;
  /** Geen eigen kaart-rand; titel staat in de omringende sectie (tab Homepagina). */
  embedded?: boolean;
}) {
  const router = useRouter();
  const [paths, setPaths] = useState(initialPaths);
  const [msg, setMsg] = useState<{ ok?: boolean; text?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPaths(initialPaths);
  }, [initialPaths]);

  function onUpload(formData: FormData, form: HTMLFormElement) {
    setMsg(null);
    startTransition(async () => {
      const r = await uploadHomeHeroBackground(formData);
      if (r.success) {
        setMsg({ ok: true, text: "Foto toegevoegd." });
        form.reset();
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error ?? "Upload mislukt." });
      }
    });
  }

  async function onRemove(p: string) {
    setMsg(null);
    startTransition(async () => {
      await removeHomeHeroBackground(p);
      setMsg({ ok: true, text: "Verwijderd." });
      router.refresh();
    });
  }

  const shell = embedded
    ? `space-y-4 ${className}`.trim()
    : `card shadow-premium border-none bg-white dark:bg-card ${className}`.trim();

  return (
    <div className={shell}>
      {!embedded ? (
        <h2 className="mb-2 text-lg font-black text-gray-900 dark:text-white">Collage achtergrond</h2>
      ) : null}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Foto’s voor de collage achter de hero. Zonder uploads vult de site aan met recente albumhoesjes. Aanbevolen: liggend of vierkant,
        minimaal 1200px breed. Schuivende rijen zet je aan of uit bij{" "}
        <span className="font-black text-gray-700 dark:text-gray-200">Website-teksten, tab Homepagina: Collage schuivende rijen</span>.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {paths.length === 0 ? (
          <p className="col-span-full text-sm font-bold text-gray-500">Nog geen eigen foto’s — de site vult aan met hoesjes uit de playlist.</p>
        ) : (
          paths.map((p) => (
            <div key={p} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 aspect-[4/3] bg-gray-100 dark:bg-white/5">
              <img src={assetUrl(p)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                disabled={pending}
                onClick={() => void onRemove(p)}
                className="absolute inset-x-2 bottom-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-600 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                Verwijderen
              </button>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          onUpload(new FormData(form), form);
        }}
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
      >
        <div className="flex-1">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nieuwe foto</label>
          <input
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="w-full text-sm font-bold text-gray-700 dark:text-gray-200 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-primary file:text-white file:font-black"
            required
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-3 rounded-2xl bg-[#1e375a] text-white font-black text-sm hover:bg-[#152a45] transition-colors disabled:opacity-50"
        >
          {pending ? "Bezig…" : "Uploaden"}
        </button>
      </form>

      {msg?.text ? (
        <p className={`mt-4 text-sm font-bold ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>
      ) : null}
    </div>
  );
}
