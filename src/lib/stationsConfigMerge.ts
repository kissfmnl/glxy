import { KEEP_STATION_LOGO } from "@/lib/glxyStations";
import { inlineApiMediaUrlIfLocal } from "@/lib/inlineMediaFromApiUrl";

/** Maakt opgeslagen `stationsConfig` JSON vanuit het admin-formulier (inclusief logo-inline en now-playing-URL). */
export async function mergeStationsConfig(raw: string, prevConfig: unknown): Promise<object[] | undefined> {
  let incoming: unknown;
  try {
    incoming = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!Array.isArray(incoming)) return undefined;
  const prevArr = Array.isArray(prevConfig) ? prevConfig : [];
  const prevById = new Map<string, { logoUrl?: string }>();
  for (const p of prevArr) {
    if (p && typeof p === "object" && typeof (p as { id?: string }).id === "string") {
      prevById.set(String((p as { id: string }).id), p as { logoUrl?: string });
    }
  }
  const out: object[] = [];
  for (const inc of incoming) {
    if (!inc || typeof inc !== "object") continue;
    const id = String((inc as { id?: string }).id ?? "").trim();
    if (!id) continue;
    const prevSt = prevById.get(id);
    let logoUrlStation = String((inc as { logoUrl?: string }).logoUrl ?? "").trim();
    if (logoUrlStation === KEEP_STATION_LOGO) {
      logoUrlStation = typeof prevSt?.logoUrl === "string" ? prevSt.logoUrl : "";
    }
    if (logoUrlStation.startsWith("/api/media/")) {
      const inlined = await inlineApiMediaUrlIfLocal(logoUrlStation);
      if (inlined?.startsWith("data:image/")) logoUrlStation = inlined;
    }
    const line1 = String((inc as { line1?: string }).line1 ?? "").trim();
    const line2 = String((inc as { line2?: string }).line2 ?? "").trim();
    const streamUrl = String((inc as { streamUrl?: string }).streamUrl ?? "").trim();
    const nowPlayingUrl = String((inc as { nowPlayingUrl?: string }).nowPlayingUrl ?? "").trim();
    const playButtonHex = String((inc as { playButtonHex?: string }).playButtonHex ?? "").trim();
    const row: Record<string, unknown> = { id, line1, line2, streamUrl };
    if (logoUrlStation) row.logoUrl = logoUrlStation;
    if (nowPlayingUrl) row.nowPlayingUrl = nowPlayingUrl;
    if (playButtonHex) row.playButtonHex = playButtonHex;
    out.push(row);
  }
  return out;
}
