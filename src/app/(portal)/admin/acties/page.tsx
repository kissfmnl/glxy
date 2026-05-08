import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { buildTrackKeys, toPublicCoverSrc } from "@/lib/throwbackCovers";
import AppImage from "@/components/AppImage";
import {
  backfillThrowbackSongCovers,
  deleteThrowbackSong,
  importThrowbackSongsSheet,
  uploadThrowbackActionImage,
  upsertThrowbackSong,
} from "@/app/actions/throwbackActions";
import { deletePublicAction, upsertPublicAction } from "@/app/actions/publicActions";

function websiteAssetUrl(rel: string | null | undefined) {
  const value = String(rel || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return "/api/assets/" + value.split("/").map(encodeURIComponent).join("/");
}

export default async function AdminActiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/settings");

  const [played, songs, actions, actionImageRow, audioHelpRow, videoHelpRow] = await Promise.all([
    prisma.playedTrack.findMany({
      where: { cover: { not: null } },
      orderBy: { playedAt: "desc" },
      take: 6000,
      select: { artist: true, title: true, cover: true },
    }),
    prisma.throwbackSong.findMany({
      orderBy: [{ sortOrder: "asc" }, { artist: "asc" }, { title: "asc" }],
    }),
    prisma.publicAction.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.siteSetting.findUnique({ where: { key: "ACTION_THROWBACK_IMAGE_PATH" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTION_THROWBACK_AUDIO_HELP" }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: "ACTION_THROWBACK_VIDEO_HELP" }, select: { value: true } }),
  ]);
  const playedCoverByKey = new Map<string, string>();
  for (const row of played) {
    const cover = toPublicCoverSrc(row.cover);
    if (!cover) continue;
    for (const key of buildTrackKeys(row.artist, row.title)) {
      if (!playedCoverByKey.has(key)) playedCoverByKey.set(key, cover);
    }
  }
  const songsWithCover = songs.map((song) => {
    const ownCover = toPublicCoverSrc(song.coverUrl);
    if (ownCover) return { ...song, _resolvedCover: ownCover };
    const fallback =
      buildTrackKeys(song.artist, song.title)
        .map((k) => playedCoverByKey.get(k))
        .find(Boolean) || null;
    return { ...song, _resolvedCover: fallback };
  });
  const actionImagePath = actionImageRow?.value ?? "";
  const audioHelpText = audioHelpRow?.value || "Stuur een korte shoutout namens je team (max 20MB, mp3/wav/m4a/webm/ogg).";
  const videoHelpText = videoHelpRow?.value || "Stuur een korte video van jullie team (max 100MB, mp4/webm/mov/avi).";

  return (
    <PortalPageShell width="wide" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Acties</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Beheer actie-kaarten én Throwback nummerbeheer.</p>
        </div>
        <Link href="/admin/inzendingen?tab=acties" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-700">
          Naar actie-aanmeldingen
        </Link>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900">Acties (publiek)</h2>
        <p className="mt-1 text-xs font-bold text-gray-500">Deze kaarten verschijnen op de homepage (Acties panel) en op /acties.</p>

        <form action={upsertPublicAction} encType="multipart/form-data" className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Titel (bijv. KISS Throwback Party)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
          <input name="slug" placeholder="Slug (optioneel; wordt automatisch gemaakt)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
          <input name="href" required placeholder="Link (href) (bijv. /throwback)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold md:col-span-2" />
          <input name="statusLabel" placeholder="Status label (bijv. Lopend)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
          <input name="ctaLabel" placeholder="Knoptekst (bijv. Naar actie)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
          <textarea name="body" rows={3} placeholder="Korte omschrijving" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold md:col-span-2" />
          <input name="sortOrder" placeholder="Volgorde (0..)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
          <label className="inline-flex items-center gap-2 text-xs font-black text-gray-700">
            <input type="checkbox" name="isActive" defaultChecked className="accent-brand-primary" />
            Actief
          </label>
          <input name="imagePath" placeholder="Afbeelding pad (Website/... of URL) (optioneel)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold md:col-span-2" />
          <input type="file" name="imageFile" accept="image/png,image/jpeg,image/webp" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold md:col-span-2" />
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-black text-white">Actie toevoegen</button>
          </div>
        </form>

        <div className="mt-6 grid gap-3">
          {actions.map((a) => (
            <details key={a.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <AppImage src={websiteAssetUrl(a.imagePath) || "/api/fallback-album-logo"} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-gray-900">{a.title}</p>
                    <p className="truncate text-xs font-bold text-gray-600">{a.href} · slug: {a.slug}</p>
                  </div>
                  <span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-black ${a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                    {a.isActive ? "Actief" : "Inactief"}
                  </span>
                </div>
              </summary>
              <form action={upsertPublicAction} encType="multipart/form-data" className="mt-3 grid gap-2 md:grid-cols-2">
                <input type="hidden" name="id" value={a.id} />
                <input name="title" defaultValue={a.title} required className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <input name="slug" defaultValue={a.slug} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <input name="href" defaultValue={a.href} required className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold md:col-span-2" />
                <input name="statusLabel" defaultValue={a.statusLabel ?? ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <input name="ctaLabel" defaultValue={a.ctaLabel ?? ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <textarea name="body" defaultValue={a.body ?? ""} rows={3} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold md:col-span-2" />
                <input name="sortOrder" defaultValue={a.sortOrder} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <label className="inline-flex items-center gap-2 text-xs font-black text-gray-700">
                  <input type="checkbox" name="isActive" defaultChecked={a.isActive} className="accent-brand-primary" />
                  Actief
                </label>
                <input name="imagePath" defaultValue={a.imagePath ?? ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold md:col-span-2" />
                <input type="file" name="imageFile" accept="image/png,image/jpeg,image/webp" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold md:col-span-2" />
                <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                  <button type="submit" className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white">Opslaan</button>
                  <button
                    type="submit"
                    formAction={deletePublicAction}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
              </form>
            </details>
          ))}
          {actions.length === 0 ? <p className="text-sm font-bold text-gray-500">Nog geen acties toegevoegd.</p> : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Actie afbeelding</h2>
          <p className="mt-1 text-xs font-bold text-gray-500">Voor homepage en /acties kaart.</p>
          <form action={uploadThrowbackActionImage} encType="multipart/form-data" className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="file"
              name="imageFile"
              accept="image/png,image/jpeg,image/webp"
              required
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold"
            />
            <button type="submit" className="rounded-xl bg-[#1e375a] px-4 py-2 text-sm font-black text-white">
              Afbeelding opslaan
            </button>
          </form>
          {actionImagePath ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <AppImage src={websiteAssetUrl(actionImagePath) || "/api/fallback-album-logo"} alt="" className="h-40 w-full object-cover" />
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Uitleg voor audio/video</h2>
          <p className="mt-1 text-xs font-bold text-gray-500">Teksten die publiek onder de uploadvelden ziet.</p>
          <form
            action={async (formData) => {
              "use server";
              const audioHelp = String(formData.get("audioHelp") || "").trim() || audioHelpText;
              const videoHelp = String(formData.get("videoHelp") || "").trim() || videoHelpText;
              await prisma.siteSetting.upsert({
                where: { key: "ACTION_THROWBACK_AUDIO_HELP" },
                create: { key: "ACTION_THROWBACK_AUDIO_HELP", value: audioHelp },
                update: { value: audioHelp },
              });
              await prisma.siteSetting.upsert({
                where: { key: "ACTION_THROWBACK_VIDEO_HELP" },
                create: { key: "ACTION_THROWBACK_VIDEO_HELP", value: videoHelp },
                update: { value: videoHelp },
              });
            }}
            className="mt-4 space-y-3"
          >
            <textarea name="audioHelp" defaultValue={audioHelpText} rows={3} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
            <textarea name="videoHelp" defaultValue={videoHelpText} rows={3} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
            <button type="submit" className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-black text-white">Uitleg opslaan</button>
          </form>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Sheet import (Google Sheets)</h2>
          <p className="mt-1 text-xs font-bold text-gray-500">
            Upload CSV met kolommen: A=Artiest, B=Nummer, C=Jaartal.
          </p>
          <form action={importThrowbackSongsSheet} encType="multipart/form-data" className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="file"
              name="sheetFile"
              accept=".csv,text/csv,text/plain"
              required
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold"
            />
            <button type="submit" className="rounded-xl bg-[#1e375a] px-4 py-2 text-sm font-black text-white">
              Importeren
            </button>
            <button
              type="submit"
              formAction={async () => {
                "use server";
                await backfillThrowbackSongCovers();
              }}
              className="rounded-xl border border-[#1e375a] bg-white px-4 py-2 text-sm font-black text-[#1e375a]"
            >
              Ontbrekende covers vullen
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Handmatig nummer toevoegen</h2>
          <form action={upsertThrowbackSong} className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="artist" required placeholder="Artiest" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
            <input name="title" required placeholder="Titel" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
            <input name="year" placeholder="Jaartal (optioneel)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
            <input name="sortOrder" placeholder="Volgorde (0..)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
            <input
              name="coverUrl"
              placeholder="Cover URL (optioneel)"
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold md:col-span-2"
            />
            <input type="file" name="coverImageFile" accept="image/png,image/jpeg,image/webp" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold md:col-span-2" />
            <label className="inline-flex items-center gap-2 text-xs font-black text-gray-700 md:col-span-2">
              <input type="checkbox" name="isActive" defaultChecked className="accent-brand-primary" />
              Actief in publieke actie
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-black text-white">
                Nummer opslaan
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900">Nummers ({songsWithCover.length})</h2>
        <div className="mt-4 grid gap-3">
          {songsWithCover.map((song) => (
            <details key={song.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <AppImage src={song._resolvedCover || "/api/fallback-album-logo"} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-gray-900">{song.title}</p>
                    <p className="truncate text-xs font-bold text-gray-600">
                      {song.artist} {song.year ? `· ${song.year}` : ""}
                    </p>
                  </div>
                  <span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-black ${song.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                    {song.isActive ? "Actief" : "Inactief"}
                  </span>
                </div>
              </summary>
              <form action={upsertThrowbackSong} className="mt-3 grid gap-2 md:grid-cols-2">
                <input type="hidden" name="id" value={song.id} />
                <input name="artist" defaultValue={song.artist} required className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <input name="title" defaultValue={song.title} required className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <input name="year" defaultValue={song.year ?? ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <input name="sortOrder" defaultValue={song.sortOrder} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                <input
                  name="coverUrl"
                  defaultValue={song.coverUrl ?? ""}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold md:col-span-2"
                />
                <input type="file" name="coverImageFile" accept="image/png,image/jpeg,image/webp" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold md:col-span-2" />
                <label className="inline-flex items-center gap-2 text-xs font-black text-gray-700 md:col-span-2">
                  <input type="checkbox" name="isActive" defaultChecked={song.isActive} className="accent-brand-primary" />
                  Actief in publieke lijst
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                  <button type="submit" className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white">
                    Opslaan
                  </button>
                  <button
                    type="submit"
                    formAction={async () => {
                      "use server";
                      await deleteThrowbackSong(song.id);
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
              </form>
            </details>
          ))}
          {songs.length === 0 ? <p className="text-sm font-bold text-gray-500">Nog geen nummers toegevoegd.</p> : null}
        </div>
      </section>
    </PortalPageShell>
  );
}
