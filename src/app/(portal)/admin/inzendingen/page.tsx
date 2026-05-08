import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { removeTrackVotes, resetPlaylistVotes } from "@/app/actions/voteActions";
import { updateThrowbackSubmissionStatus } from "@/app/actions/throwbackActions";
import { hasPortalPermission } from "@/lib/portalPermissions";
import AppImage from "@/components/AppImage";

const MAP_KEY = "PLAYLIST_VOTES_MAP";
const LOG_KEY = "PLAYLIST_VOTES_LOG";

function websiteAssetUrl(rel: string | null | undefined) {
  const value = String(rel || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return "/api/assets/" + value.split("/").map(encodeURIComponent).join("/");
}

export default async function AdminInzendingenPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "managePlaylistVotes")) redirect("/settings");
  const tab = searchParams?.tab === "acties" ? "acties" : "playlist";

  const [mapRow, logRow, submissions] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: MAP_KEY }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: LOG_KEY }, select: { value: true } }),
    prisma.throwbackSubmission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        picks: {
          orderBy: { rank: "asc" },
          include: { song: true },
        },
        customPicks: {
          orderBy: { rank: "asc" },
        },
      },
      take: 300,
    }),
  ]);

  const votes = mapRow?.value ? (JSON.parse(mapRow.value) as Record<string, any>) : {};
  const logs = logRow?.value
    ? (JSON.parse(logRow.value) as Array<{
        trackId: string;
        title: string;
        artist: string;
        cover?: string | null;
        voteType?: "up" | "down" | "clear";
        votedAt: string;
      }>)
    : [];

  const logMap = new Map<string, { title: string; artist: string }>();
  for (const item of logs) {
    if (!logMap.has(item.trackId) && item.title) logMap.set(item.trackId, { title: item.title, artist: item.artist || "" });
  }
  const normalized = Object.entries(votes).map(([trackId, value]) => {
    if (typeof value === "number") {
      const fromLog = logMap.get(trackId);
      return { trackId, title: fromLog?.title || trackId, artist: fromLog?.artist || "", score: value, up: Math.max(0, value), down: 0, cover: null as string | null };
    }
    return {
      trackId,
      title: value?.title || logMap.get(trackId)?.title || trackId,
      artist: value?.artist || logMap.get(trackId)?.artist || "",
      score: Number(value?.score || 0),
      up: Number(value?.up || 0),
      down: Number(value?.down || 0),
      cover: (value?.cover as string) || null,
    };
  });
  const sortedVotes = normalized.sort((a, b) => b.score - a.score);

  return (
    <PortalPageShell width="wide" className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Inzendingen & stemmen</h1>
        <p className="mt-1 text-sm text-gray-500">Overkoepelend overzicht van playlist stemmen en actie-aanmeldingen.</p>
      </div>

      <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
        <Link href="/admin/inzendingen?tab=playlist" className={`rounded-xl px-4 py-2 text-xs font-black ${tab === "playlist" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
          Playlist stemmen
        </Link>
        <Link href="/admin/inzendingen?tab=acties" className={`rounded-xl px-4 py-2 text-xs font-black ${tab === "acties" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
          Actie aanmeldingen
        </Link>
      </div>

      {tab === "playlist" ? (
        <>
          <form
            action={async () => {
              "use server";
              await resetPlaylistVotes();
            }}
          >
            <button type="submit" className="px-4 py-2 rounded-xl font-black text-white bg-red-500 hover:bg-red-600">
              Reset alle stemmen
            </button>
          </form>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <h2 className="text-lg font-black mb-4">Scores</h2>
              <div className="space-y-2">
                {sortedVotes.length === 0 ? <p className="text-sm text-gray-500">Nog geen stemmen.</p> : sortedVotes.slice(0, 100).map((item) => (
                  <div key={item.trackId} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        {item.cover ? <AppImage src={item.cover} alt="" className="w-full h-full object-cover" loading="lazy" /> : null}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs font-bold text-gray-600 truncate">{item.artist || item.trackId}</p>
                        <p className="text-[11px] font-bold text-gray-500">▲ {item.up} / ▼ {item.down}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-brand-primary">{item.score}</span>
                      <form
                        action={async (formData) => {
                          "use server";
                          await removeTrackVotes(formData);
                        }}
                      >
                        <input type="hidden" name="trackId" value={item.trackId} />
                        <button type="submit" className="px-2 py-1 rounded-lg text-[11px] font-black border border-red-200 bg-red-50 text-red-600">
                          Verwijder
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <h2 className="text-lg font-black mb-4">Stemlog (recent)</h2>
              <div className="space-y-2 max-h-[560px] overflow-auto">
                {logs.length === 0 ? <p className="text-sm text-gray-500">Nog geen stemmomenten.</p> : logs.slice(0, 200).map((item, idx) => (
                  <div key={`${item.trackId}-${idx}`} className="rounded-xl border border-gray-200 px-3 py-2 flex gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      {item.cover ? <AppImage src={item.cover} alt="" className="w-full h-full object-cover" loading="lazy" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-gray-900 truncate">{item.title || item.trackId}</p>
                      <p className="text-xs font-bold text-gray-600 truncate">{item.artist || "-"}</p>
                      <p className="text-[10px] font-black mt-1 text-gray-500">
                        {item.voteType === "down" ? "Dislike" : item.voteType === "clear" ? "Stem verwijderd" : "Like"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Actie aanmeldingen ({submissions.length})</h2>
          <div className="mt-4 space-y-3">
            {submissions.map((entry) => (
              <details key={entry.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-black text-gray-900">{entry.companyName}</p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
                      entry.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : entry.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {entry.status === "APPROVED" ? "Goedgekeurd" : entry.status === "REJECTED" ? "Afgekeurd" : "Open"}
                    </span>
                    <span className="text-xs font-bold text-gray-500">{entry.contactName} · {entry.email} · {entry.phone}</span>
                  </div>
                </summary>
                <div className="mt-3 grid gap-3 lg:grid-cols-[180px_1fr]">
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <AppImage src={websiteAssetUrl(entry.teamPhotoPath) || "/api/fallback-album-logo"} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-500">Gekozen tracks</p>
                    <ol className="mt-2 space-y-1">
                      {entry.picks.map((pick) => (
                        <li key={pick.id} className="text-sm font-bold text-gray-700">
                          {pick.rank}. {pick.song.artist} — {pick.song.title}
                        </li>
                      ))}
                      {entry.customPicks.map((pick) => (
                        <li key={pick.id} className="text-sm font-bold text-gray-700">
                          {pick.rank}. {pick.artist} — {pick.title}
                          {pick.year ? <span className="text-gray-500"> ({pick.year})</span> : null}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={updateThrowbackSubmissionStatus}>
                        <input type="hidden" name="id" value={entry.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button type="submit" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">Markeer goed</button>
                      </form>
                      <form action={updateThrowbackSubmissionStatus}>
                        <input type="hidden" name="id" value={entry.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button type="submit" className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white">Markeer af</button>
                      </form>
                      <form action={updateThrowbackSubmissionStatus}>
                        <input type="hidden" name="id" value={entry.id} />
                        <input type="hidden" name="status" value="PENDING" />
                        <button type="submit" className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-black text-gray-700">Zet open</button>
                      </form>
                      {entry.audioMessagePath ? (
                        <a href={websiteAssetUrl(entry.audioMessagePath) || undefined} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-black text-gray-700">
                          Audio bekijken
                        </a>
                      ) : null}
                      {entry.videoMessagePath ? (
                        <a href={websiteAssetUrl(entry.videoMessagePath) || undefined} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-black text-gray-700">
                          Video bekijken
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </details>
            ))}
            {submissions.length === 0 ? <p className="text-sm font-bold text-gray-500">Nog geen inzendingen ontvangen.</p> : null}
          </div>
        </section>
      )}
    </PortalPageShell>
  );
}
