import { Suspense } from "react";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import WhatsAppWidget from "@/components/widgets/WhatsAppWidget";
import NowPlayingWidget from "@/components/widgets/NowPlayingWidget";
import TrafficWidget from "@/components/widgets/TrafficWidget";
import { StudioLoggerPlaceholder, OmniPlayerPlaceholder } from "@/components/widgets/Placeholders";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAlbumCover } from "@/app/actions/albumActions";
import AppImage from "@/components/AppImage";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userName = session?.user?.name ?? "Gast";
  const now = new Date();
  const [votesRow, logsRow] = await Promise.all([
    prisma.siteSetting.findUnique({
      where: { key: "PLAYLIST_VOTES_MAP" },
      select: { value: true },
    }),
    prisma.siteSetting.findUnique({
      where: { key: "PLAYLIST_VOTES_LOG" },
      select: { value: true },
    }),
  ]);
  const voteMap = votesRow?.value ? (JSON.parse(votesRow.value) as Record<string, any>) : {};
  const logMap = new Map<string, { title: string; artist: string }>();
  if (logsRow?.value) {
    const logs = JSON.parse(logsRow.value) as Array<{ trackId: string; title: string; artist: string }>;
    for (const item of logs) {
      if (!logMap.has(item.trackId) && item.title) {
        logMap.set(item.trackId, { title: item.title, artist: item.artist || "" });
      }
    }
  }
  const topVotedRaw = Object.entries(voteMap)
    .map(([trackId, value]) => {
      if (typeof value === "number") {
        const fromLog = logMap.get(trackId);
        return {
          trackId,
          title: fromLog?.title || trackId,
          artist: fromLog?.artist || "",
          score: value,
          cover: undefined as string | undefined,
        };
      }
      return {
        trackId,
        title: String(value?.title || logMap.get(trackId)?.title || trackId),
        artist: String(value?.artist || logMap.get(trackId)?.artist || ""),
        score: Number(value?.score || 0),
        cover: typeof value?.cover === "string" ? value.cover : undefined,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const topVoted = await Promise.all(
    topVotedRaw.map(async (item) => ({
      ...item,
      coverUrl: item.cover || (item.artist && item.title ? await getAlbumCover(item.artist, item.title) : null),
    }))
  );

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 6) return "Goedenacht";
    if (hour < 12) return "Goedemorgen";
    if (hour < 18) return "Goedemiddag";
    return "Goedenavond";
  };

  return (
    <PortalPageShell width="wide" className="pb-12 pt-4">
      <header className="mb-10 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-left text-3xl font-black text-gray-900 dark:text-white">
            {getGreeting().toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}, {userName}!
          </h1>
          <span className="rounded-lg border border-brand-primary/25 bg-brand-primary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-brand-primary">
            Beta
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {now.toLocaleDateString("nl-NL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="flex flex-col gap-8 xl:col-span-7">
          <section className="min-h-[240px] shrink-0 lg:min-h-[260px]">
            <Suspense fallback={<WidgetSkeleton className="h-full min-h-[240px]" />}>
              <WhatsAppWidget />
            </Suspense>
          </section>

          <section className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <StudioLoggerPlaceholder />
            <OmniPlayerPlaceholder />
          </section>
        </div>

        <div className="flex flex-col gap-8 xl:col-span-5">
          <section className="h-[220px] shrink-0 lg:h-[228px]">
            <Suspense fallback={<WidgetSkeleton className="h-full" />}>
              <NowPlayingWidget />
            </Suspense>
          </section>

          <section className="min-h-[280px] flex-1">
            <Suspense fallback={<WidgetSkeleton className="h-full min-h-[280px]" />}>
              <TrafficWidget />
            </Suspense>
          </section>

          <section className="shrink-0">
            <div className="card overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-card">
              <div className="border-b border-gray-100 bg-gray-50/90 p-6 dark:border-white/10 dark:bg-white/[0.03]">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Populairste nummers
                </h2>
                <p className="mt-2 text-[11px] font-bold leading-snug text-gray-400 dark:text-gray-500">
                  Op basis van playlist-stemmen
                </p>
              </div>
              <div className="custom-scrollbar max-h-[320px] space-y-3 overflow-y-auto p-6">
                {topVoted.length === 0 ? (
                  <p className="py-2 text-sm font-bold text-gray-500 dark:text-gray-400">Nog geen stemmen.</p>
                ) : (
                  topVoted.map((item, idx) => (
                    <div
                      key={item.trackId}
                      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <span className="w-7 shrink-0 tabular-nums text-center text-xs font-black text-brand-primary">
                        {idx + 1}
                      </span>
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-gray-200 dark:bg-white/10">
                        {item.coverUrl ? (
                          <AppImage src={item.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="line-clamp-2 text-sm font-black leading-snug text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 truncate text-[11px] font-bold text-gray-600 dark:text-gray-400">
                          {item.artist || "Onbekend"}
                        </p>
                      </div>
                      <span className="shrink-0 pl-1 text-lg font-black tabular-nums text-brand-primary">{item.score}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </PortalPageShell>
  );
}

function WidgetSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`card flex animate-pulse flex-col rounded-3xl border border-gray-200/80 dark:border-white/10 ${className}`}>
      <div className="space-y-4 p-6">
        <div className="mx-0.5 h-4 w-1/3 rounded-md bg-gray-200/80 dark:bg-white/10" />
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-gray-200/60 dark:bg-white/10" />
          <div className="h-14 rounded-xl bg-gray-200/60 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}
