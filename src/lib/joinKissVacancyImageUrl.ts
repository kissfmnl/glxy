import type { JoinKissSlot } from "@/lib/joinKissDefaults";

/** Publieke URL voor vacature-afbeelding (via /api/join-kiss-vacancy-image). */
export function joinKissVacancyImageUrl(slot: JoinKissSlot, imagePath?: string | null): string {
  const p = (imagePath ?? "").trim();
  if (p) {
    return `/api/join-kiss-vacancy-image?path=${encodeURIComponent(p)}&slot=${encodeURIComponent(slot)}`;
  }
  return `/api/join-kiss-vacancy-image?slot=${encodeURIComponent(slot)}`;
}
