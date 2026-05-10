import { prisma } from "@/lib/prisma";

/** Één DB-write voor meerdere zenders (voorkomt race bij parallelle updates). */
export async function persistNpSnapshotMerge(
  updates: Record<string, { title: string; artist: string; coverUrl?: string | null }>,
): Promise<void> {
  const ts = new Date().toISOString();
  const entries = Object.entries(updates).filter(([, v]) => v.title.trim() || v.artist.trim());
  if (entries.length === 0) return;
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationNpSnapshot: true } });
    const prev =
      row?.stationNpSnapshot && typeof row.stationNpSnapshot === "object" && !Array.isArray(row.stationNpSnapshot)
        ? { ...(row.stationNpSnapshot as Record<string, unknown>) }
        : {};
    for (const [id, { title, artist, coverUrl }] of entries) {
      const c =
        typeof coverUrl === "string" && /^https?:\/\//i.test(coverUrl.trim()) ? coverUrl.trim().slice(0, 2000) : null;
      prev[id] = { title, artist, updatedAt: ts, ...(c ? { coverUrl: c } : {}) };
    }
    await prisma.branding.update({
      where: { id: 1 },
      data: { stationNpSnapshot: prev as object },
    });
  } catch {
    /* ignore */
  }
}
