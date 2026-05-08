"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Song = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  coverUrl: string | null;
};

function fallbackCover() {
  return "/api/fallback-album-logo";
}

export function ThrowbackSongPicker({ songs }: { songs: Song[] }) {
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [freeChoiceCount, setFreeChoiceCount] = useState<number>(0);
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(songs.map((s) => s.year).filter((y): y is number => typeof y === "number")));
    years.sort((a, b) => b - a);
    return years;
  }, [songs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((song) => {
      if (selectedYear && String(song.year ?? "") !== selectedYear) return false;
      if (!q) return true;
      return `${song.artist} ${song.title} ${song.year ?? ""}`.toLowerCase().includes(q);
    });
  }, [songs, query, selectedYear]);

  function toggleSong(songId: string) {
    setSelectedSongIds((prev) => {
      if (prev.includes(songId)) return prev.filter((id) => id !== songId);
      if (prev.length + freeChoiceCount >= 10) return prev;
      return [...prev, songId];
    });
  }

  const totalSelected = selectedSongIds.length + freeChoiceCount;
  const canContinue = totalSelected >= 6 && totalSelected <= 10;
  const nextHref = `/throwback/gegevens?songIds=${encodeURIComponent(selectedSongIds.join(","))}&free=${encodeURIComponent(String(freeChoiceCount))}`;
  const selectedSongs = selectedSongIds.map((id) => songs.find((s) => s.id === id)).filter((s): s is Song => Boolean(s));

  return (
    <div className="grid min-w-0 gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-5 rounded-3xl border border-[#1e375a]/12 bg-white/95 p-5 shadow-sm md:p-7">
        <div className="rounded-2xl border border-[#cce1f3] bg-[#eff7ff] p-4">
          <p className="text-sm font-black text-[#1e375a]">
            Selectie: <span className={totalSelected >= 6 ? "text-emerald-700" : "text-red-600"}>{totalSelected}</span> / 10
          </p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[#365579]">Zoek nummers</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Typ artiest, titel of jaartal..."
              className="w-full rounded-2xl border-2 border-[#9fc7e8] bg-white px-4 py-3 text-base font-black text-[#1e375a] outline-none transition focus:border-[#37bfbf] focus:ring-2 focus:ring-[#37bfbf]/30"
            />
          </label>

          <div className="-mx-1 overflow-x-auto px-1">
            <div className="flex min-w-max flex-nowrap gap-2 pb-1">
              <button
                type="button"
                onClick={() => setSelectedYear("")}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${
                  selectedYear === "" ? "border-[#1e375a] bg-[#1e375a] text-white" : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                Alle jaren
              </button>
              {yearOptions.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(String(year))}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${
                    selectedYear === String(year)
                      ? "border-[#1e375a] bg-[#1e375a] text-white"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#d9e4ef] bg-[#f7fbff] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-black text-[#1e375a]">Vrije keuze</p>
              <p className="mt-0.5 text-[11px] font-bold text-gray-600">Voeg een eigen nummer toe (je vult ’m in bij stap 2).</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFreeChoiceCount((n) => Math.max(0, n - 1))}
                disabled={freeChoiceCount === 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-black text-gray-700 disabled:opacity-40"
                aria-label="Vrije keuze verwijderen"
              >
                –
              </button>
              <div className="rounded-full border border-[#1e375a]/15 bg-white px-3 py-1.5 text-xs font-black text-[#1e375a]">
                {freeChoiceCount}
              </div>
              <button
                type="button"
                onClick={() => setFreeChoiceCount((n) => (selectedSongIds.length + n >= 10 ? n : n + 1))}
                disabled={selectedSongIds.length + freeChoiceCount >= 10}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-black text-gray-700 disabled:opacity-40"
                aria-label="Vrije keuze toevoegen"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div
          key={`${selectedYear}|${query.trim().toLowerCase()}`}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-[kiss-filter-in_.25s_ease-out]"
        >
          {filtered.map((song) => {
            const active = selectedSongIds.includes(song.id);
            return (
              <button
                key={song.id}
                type="button"
                onClick={() => toggleSong(song.id)}
                className={`group flex items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                  active ? "border-[#37bfbf] bg-[#dff5f5] ring-2 ring-[#37bfbf]/35" : "border-gray-200 bg-white hover:border-[#9fc7e8]"
                }`}
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-[#f2f8fb]">
                  <img src={song.coverUrl || fallbackCover()} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#1e375a]">{song.title}</p>
                  <p className="truncate text-xs font-bold text-gray-600">{song.artist}</p>
                  <p className="text-[11px] font-black text-[#365579]">{song.year ?? "Onbekend jaar"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="order-first h-fit rounded-3xl border border-[#1e375a]/12 bg-white/95 p-4 shadow-sm lg:order-none lg:sticky lg:top-24">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#365579]">Jouw selectie</p>
        <div className="mt-3 space-y-2">
          {selectedSongs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-xs font-bold text-gray-500">
              Nog geen nummers gekozen.
            </p>
          ) : (
            selectedSongs.map((song, index) => (
              <div key={song.id} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
                <div className="h-10 w-10 overflow-hidden rounded-lg border border-gray-200 bg-[#f2f8fb]">
                  <img src={song.coverUrl || fallbackCover()} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-[#1e375a]">
                    {index + 1}. {song.title}
                  </p>
                  <p className="truncate text-[11px] font-bold text-gray-600">{song.artist}</p>
                </div>
              </div>
            ))
          )}
          {Array.from({ length: freeChoiceCount }, (_, i) => (
            <div key={`free-${i}`} className="flex items-center gap-2 rounded-xl border border-[#d9e4ef] bg-[#f7fbff] p-2">
              <div className="h-10 w-10 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-[#1e375a]/70">Free</div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#1e375a]">{selectedSongs.length + i + 1}. Vrije keuze</p>
                <p className="truncate text-[11px] font-bold text-gray-600">Vul je eigen nummer in</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-gray-200 pt-3">
          <Link
            href={canContinue ? nextHref : "#"}
            aria-disabled={!canContinue}
            className={`inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-black text-white ${
              canContinue ? "bg-[#1e375a] hover:bg-[#162c49]" : "pointer-events-none bg-gray-400"
            }`}
          >
            Verder naar gegevens
          </Link>
        </div>
      </aside>
    </div>
  );
}
