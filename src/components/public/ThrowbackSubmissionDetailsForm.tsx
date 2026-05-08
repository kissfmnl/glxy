"use client";

import { usePathname, useRouter } from "next/navigation";
import AppImage from "@/components/AppImage";
import { MOCK_COVER_FALLBACK } from "@/lib/mock/site";

type Song = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  coverUrl: string | null;
};

export function ThrowbackSubmissionDetailsForm({
  songs,
  freeChoiceCount,
  audioHelpText,
  videoHelpText,
}: {
  songs: Song[];
  freeChoiceCount: number;
  audioHelpText: string;
  videoHelpText: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const startedAt = Date.now();

  return (
    <form
      className="space-y-6 rounded-3xl border border-[#1e375a]/12 bg-white/95 p-5 shadow-sm md:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`${pathname}?submitted=1`);
      }}
    >
      <div className="rounded-2xl border border-[#d9e4ef] bg-[#f7fbff] p-4">
        <p className="text-sm font-black text-[#1e375a]">Jouw selectie ({songs.length + freeChoiceCount} nummers)</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {songs.map((song, index) => (
          <div key={song.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2.5">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-[#f2f8fb]">
              <AppImage src={song.coverUrl || MOCK_COVER_FALLBACK} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#1e375a]">
                {index + 1}. {song.title}
              </p>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 truncate text-xs font-bold text-gray-600">{song.artist}</p>
                {song.year ? (
                  <span className="shrink-0 rounded-full border border-[#1e375a]/15 bg-[#eff7ff] px-2 py-0.5 text-[10px] font-black text-[#1e375a]">
                    {song.year}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {Array.from({ length: freeChoiceCount }, (_, i) => (
          <div key={`free-card-${i}`} className="flex items-center gap-3 rounded-2xl border border-[#d9e4ef] bg-[#f7fbff] p-2.5">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-[#1e375a]/70">Free</div>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#1e375a]">{songs.length + i + 1}. Vrije keuze</p>
              <p className="truncate text-xs font-bold text-gray-600">Je vult dit nummer hieronder in</p>
            </div>
          </div>
        ))}
      </div>

      {songs.map((song) => (
        <input key={song.id} type="hidden" name="songIds" value={song.id} readOnly />
      ))}
      <input type="hidden" name="freeChoiceCount" value={String(freeChoiceCount)} readOnly />
      <input type="hidden" name="startedAt" value={String(startedAt)} readOnly />
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" readOnly />

      {freeChoiceCount > 0 ? (
        <div className="rounded-2xl border border-[#d9e4ef] bg-[#f7fbff] p-4">
          <p className="text-sm font-black text-[#1e375a]">Vrije keuze invullen</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Array.from({ length: freeChoiceCount }, (_, i) => (
              <div key={`free-input-${i}`} className="rounded-2xl border border-gray-200 bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Vrije keuze {i + 1}</p>
                <div className="mt-2 grid gap-2">
                  <input
                    name={`freeArtist_${i + 1}`}
                    required
                    maxLength={140}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none transition focus:ring-2 focus:ring-[#37bfbf]/45"
                    placeholder="Artiest"
                  />
                  <input
                    name={`freeTitle_${i + 1}`}
                    required
                    maxLength={160}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none transition focus:ring-2 focus:ring-[#37bfbf]/45"
                    placeholder="Titel"
                  />
                  <input
                    name={`freeYear_${i + 1}`}
                    inputMode="numeric"
                    maxLength={4}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none transition focus:ring-2 focus:ring-[#37bfbf]/45"
                    placeholder="Jaar (optioneel)"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Bedrijfsnaam</span>
          <input
            name="companyName"
            required
            maxLength={120}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none transition focus:ring-2 focus:ring-[#37bfbf]/45"
            placeholder="Demo team GLXY"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Contactpersoon</span>
          <input
            name="contactName"
            required
            maxLength={120}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none transition focus:ring-2 focus:ring-[#37bfbf]/45"
            placeholder="Naam"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">E-mailadres</span>
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none transition focus:ring-2 focus:ring-[#37bfbf]/45"
            placeholder="hello@demo.nl"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Telefoonnummer</span>
          <input
            name="phone"
            required
            maxLength={25}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none transition focus:ring-2 focus:ring-[#37bfbf]/45"
            placeholder="+31 6 00000000"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Teamfoto</span>
          <input
            name="teamPhoto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1e375a] file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Audiobericht (optioneel)</span>
          <input
            name="audioMessage"
            type="file"
            accept="audio/*"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1e375a] file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
          />
          <span className="mt-1 block text-[11px] font-bold text-gray-500">{audioHelpText}</span>
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Videobericht (optioneel)</span>
          <input
            name="videoMessage"
            type="file"
            accept="video/*"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1e375a] file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
          />
          <span className="mt-1 block text-[11px] font-bold text-gray-500">{videoHelpText}</span>
        </label>
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-4">
        <button type="submit" className="rounded-xl bg-[#1e375a] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#162c49]">
          Demo: voltooien
        </button>
      </div>
    </form>
  );
}
