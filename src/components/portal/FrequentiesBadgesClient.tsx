"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import AppImage from "@/components/AppImage";
import {
  clearFrequentiesCoverageMap,
  clearFrequentiesStoreBadge,
  setFrequentiesAssetFromExisting,
  uploadFrequentiesCoverageMap,
  uploadFrequentiesStoreBadge,
} from "@/app/actions/frequentiesBadgeActions";

function assetUrl(rel: string) {
  return "/api/assets/" + rel.split("/").map(encodeURIComponent).join("/");
}

export function FrequentiesBadgesClient({
  iosPath,
  androidPath,
  coverageMapPath,
  imageOptions,
}: {
  iosPath: string | null;
  androidPath: string | null;
  coverageMapPath: string | null;
  imageOptions: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-sm font-black text-gray-900 dark:text-white">Frequentiekaart (rechts op de pagina)</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-white/65">
          Upload je eigen PNG (of WebP/JPEG). Geen upload = de standaardkaart uit de map Website. Ronde hoeken zitten in je
          bestand; de site toont de afbeelding 1-op-1.
        </p>
        {coverageMapPath ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-black/5 bg-white p-3 dark:bg-black/25">
            <AppImage
              src={assetUrl(coverageMapPath)}
              alt=""
              className="mx-auto max-h-48 w-full max-w-md object-contain object-center"
            />
            <p className="mt-2 break-all text-[10px] font-mono text-gray-500">{coverageMapPath}</p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-500">Nu: standaardbestand uit Website.</p>
        )}
        <form
          className="mt-4 space-y-3"
          action={(fd) => {
            start(async () => {
              const r = await uploadFrequentiesCoverageMap(fd);
              if (!r.success) alert(r.error || "Upload mislukt");
              else router.refresh();
            });
          }}
        >
          <input
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full max-w-md rounded-xl bg-[#1e375a] py-2.5 text-xs font-black text-white transition-colors hover:bg-[#2a4a73] disabled:opacity-50"
          >
            {pending ? "Bezig…" : "Kaart uploaden"}
          </button>
        </form>
        <form
          className="mt-3 space-y-2"
          action={(fd) => {
            start(async () => {
              const rel = String(fd.get("existingPath") || "");
              const r = await setFrequentiesAssetFromExisting("coverageMap", rel);
              if (!r.success) alert(r.error || "Opslaan mislukt");
              else router.refresh();
            });
          }}
        >
          <select name="existingPath" defaultValue="" className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold">
            <option value="">Kies bestaande afbeelding</option>
            {imageOptions.map((f) => (
              <option key={`map-${f}`} value={f}>{f}</option>
            ))}
          </select>
          <button type="submit" disabled={pending} className="w-full max-w-md rounded-xl border border-[#1e375a]/20 bg-white py-2 text-xs font-black text-[#1e375a] hover:bg-gray-50 disabled:opacity-50">
            Gebruik gekozen bestand
          </button>
        </form>
        {coverageMapPath ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                await clearFrequentiesCoverageMap();
                router.refresh();
              });
            }}
            className="mt-2 w-full max-w-md rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            Terug naar standaardkaart
          </button>
        ) : null}
      </div>

      <div>
        <p className="text-sm text-gray-600 dark:text-white/65">
          App Store en Google Play knoppen (PNG of SVG). Laat leeg voor de standaard badges van Apple en Google.
        </p>

        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          {(
            [
              { which: "ios" as const, label: "App Store", path: iosPath },
              { which: "android" as const, label: "Google Play", path: androidPath },
            ] as const
          ).map(({ which, label, path }) => (
            <div
              key={which}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <h2 className="text-sm font-black text-gray-900 dark:text-white">{label}</h2>
              {path ? (
                <div className="mt-3 rounded-xl border border-black/5 bg-gray-50 p-4 dark:bg-black/20">
                  <AppImage
                    src={assetUrl(path)}
                    alt=""
                    className="mx-auto max-h-16 w-auto max-w-full object-contain object-center"
                  />
                  <p className="mt-2 break-all text-[10px] font-mono text-gray-500">{path}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500">Standaardbadge van de leverancier.</p>
              )}
              <form
                className="mt-4 space-y-3"
                action={(fd) => {
                  start(async () => {
                    const r = await uploadFrequentiesStoreBadge(fd);
                    if (!r.success) alert(r.error || "Upload mislukt");
                    else router.refresh();
                  });
                }}
              >
                <input type="hidden" name="which" value={which} />
                <input
                  name="file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-[#1e375a] py-2.5 text-xs font-black text-white transition-colors hover:bg-[#2a4a73] disabled:opacity-50"
                >
                  {pending ? "Bezig…" : "Uploaden"}
                </button>
              </form>
              <form
                className="mt-3 space-y-2"
                action={(fd) => {
                  start(async () => {
                    const rel = String(fd.get("existingPath") || "");
                    const r = await setFrequentiesAssetFromExisting(which, rel);
                    if (!r.success) alert(r.error || "Opslaan mislukt");
                    else router.refresh();
                  });
                }}
              >
                <select name="existingPath" defaultValue="" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold">
                  <option value="">Kies bestaande afbeelding</option>
                  {imageOptions.map((f) => (
                    <option key={`${which}-${f}`} value={f}>{f}</option>
                  ))}
                </select>
                <button type="submit" disabled={pending} className="w-full rounded-xl border border-[#1e375a]/20 bg-white py-2 text-xs font-black text-[#1e375a] hover:bg-gray-50 disabled:opacity-50">
                  Gebruik gekozen bestand
                </button>
              </form>
              {path ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    start(async () => {
                      await clearFrequentiesStoreBadge(which);
                      router.refresh();
                    });
                  }}
                  className="mt-2 w-full rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
                >
                  Terug naar standaard
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
