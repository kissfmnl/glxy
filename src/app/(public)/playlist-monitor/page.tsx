import { cookies } from "next/headers";
import { getBranding } from "@/lib/brandingDb";
import { buildGlxyStationsFromDb } from "@/lib/glxyStations";
import { MONITOR_AUTH_COOKIE, monitorExpectedCode } from "@/lib/monitorAuth";
import { monitorLoginAction, monitorLogoutAction } from "@/app/actions/publicMonitorActions";
import { PlaylistKeepaliveMonitorClient } from "@/components/public/PlaylistKeepaliveMonitorClient";

export const dynamic = "force-dynamic";

export default async function PlaylistMonitorPage({ searchParams }: { searchParams?: { err?: string } }) {
  const store = await cookies();
  const authed = store.get(MONITOR_AUTH_COOKIE)?.value === monitorExpectedCode();
  const branding = await getBranding();
  const stations = buildGlxyStationsFromDb(branding.stationsConfig).map((s) => ({ id: s.id, label: s.line1 }));
  const returnTo = "/playlist-monitor";

  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-[#0f172a]/90 p-6 shadow-xl">
          <h1 className="text-2xl font-black text-white">Playlist keepalive</h1>
          <p className="mt-2 text-sm text-gray-300">
            Aparte monitor-pagina: laat open om continu nu-speelt te pollen en Just played te vullen.
          </p>
          {searchParams?.err === "1" ? (
            <p className="mt-3 rounded-xl border border-red-500/40 bg-red-950/50 px-3 py-2 text-sm font-bold text-red-200">
              Verkeerde code.
            </p>
          ) : null}
          <form action={monitorLoginAction} className="mt-4 space-y-3">
            <input type="hidden" name="returnTo" value={returnTo} />
            <input
              name="code"
              type="password"
              placeholder="Toegangscode"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm font-semibold text-white outline-none ring-cyan-500/30 focus:ring-2"
              required
            />
            <button className="h-10 rounded-full bg-cyan-600 px-5 text-sm font-black text-white transition hover:bg-cyan-500">
              Openen
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500">
            Zelfde code als /monitor — env <span className="font-mono">MONITOR_PAGE_CODE</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Playlist keepalive</h1>
          <p className="mt-1 text-xs text-gray-400">/playlist-monitor — nu-speelt batch + geschiedenis</p>
        </div>
        <form action={monitorLogoutAction}>
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="h-9 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-black text-white transition hover:bg-white/15">
            Uitloggen
          </button>
        </form>
      </div>
      {stations.length === 0 ? (
        <p className="text-sm text-amber-200">Geen zenders gevonden in stationsConfig.</p>
      ) : (
        <PlaylistKeepaliveMonitorClient stations={stations} />
      )}
    </div>
  );
}
