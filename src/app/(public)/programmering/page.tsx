import { ProgrammingAgenda } from "@/components/public/ProgrammingAgenda";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL_WIDE } from "@/lib/publicPageLayout";
import { getBranding } from "@/lib/brandingDb";
import { processNowPlayingMetadata } from "@/lib/npWordFilter";
import { getPublicProgrammingData } from "@/lib/publicProgramming";
import { glxyChannelHeading } from "@/lib/glxyStations";

type NpSnap = { title?: string; artist?: string; updatedAt?: string };

function parseStationRows(stationsConfig: unknown): Array<{ id: string; line1: string; offAir: boolean; idx: number }> {
  if (!Array.isArray(stationsConfig)) return [];
  const out: Array<{ id: string; line1: string; offAir: boolean; idx: number }> = [];
  stationsConfig.forEach((row, idx) => {
    if (!row || typeof row !== "object") return;
    const o = row as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    if (!id) return;
    const line1 = typeof o.line1 === "string" && o.line1.trim() ? o.line1.trim() : "GLXY Radio";
    out.push({ id, line1, offAir: o.offAir === true, idx });
  });
  return out;
}

function fmtNlUpdated(iso?: string): string | null {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });
}

export default async function ProgrammeringPage() {
  const branding = await getBranding();
  const { slots, temporarySlots } = getPublicProgrammingData(branding);
  const subtitle = "Weekoverzicht en — waar beschikbaar — laatste live titel per zender.";
  const liveBadgeText = "Nu op stream";

  const snapRaw = branding.stationNpSnapshot;
  const snap: Record<string, NpSnap> =
    snapRaw && typeof snapRaw === "object" && !Array.isArray(snapRaw) ? (snapRaw as Record<string, NpSnap>) : {};

  const stationRows = parseStationRows(branding.stationsConfig);

  return (
    <div className={PUBLIC_PAGE_SHELL_WIDE}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          Programmering
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">{subtitle}</p>
      </div>

      {stationRows.length > 0 ? (
        <section className="mt-10 rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-[var(--brand-navy)]">Live op de stream</h2>
          <p className="mt-1 text-sm text-gray-600">
            Laatst opgeslagen nu-speelt (wordt bijgewerkt zolang de metadata-URL bereikbaar is). Off-air zenders staan ter referentie in de lijst.
          </p>
          <ul className="mt-4 divide-y divide-black/5">
            {stationRows.map((row) => {
              const np = snap[row.id];
              const rawTitle = (np?.title ?? "").trim();
              const rawArtist = (np?.artist ?? "").trim();
              const { title, artist } = processNowPlayingMetadata(rawTitle, rawArtist, branding.npWordFilter);
              const line =
                artist && title ? `${artist} — ${title}` : title || artist || "—";
              const updated = fmtNlUpdated(np?.updatedAt);
              return (
                <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                      {glxyChannelHeading(row.id, row.idx)}
                      {row.offAir ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900">
                          Off-air
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 font-semibold text-gray-800">{row.line1}</p>
                  </div>
                  <div className="min-w-0 max-w-full text-right md:max-w-[60%]">
                    <p className="font-black text-gray-900">{line}</p>
                    {updated ? <p className="mt-1 text-xs text-gray-500">Bijgewerkt {updated}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {slots.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6">
          <p className="text-sm font-bold text-gray-700">Geen demo-slots.</p>
        </div>
      ) : (
        <div className="mt-10">
          <ProgrammingAgenda slots={slots} temporarySlots={temporarySlots} liveBadgeText={liveBadgeText} />
        </div>
      )}
    </div>
  );
}
