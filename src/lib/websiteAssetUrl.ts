/** Publieke media-URL voor UI; geen `/api/assets` in static demo-modus. */
export function websiteAssetUrl(rel: string | null | undefined): string | null {
  const raw = (rel ?? "").trim().replace(/\\/g, "/");
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return null;
}
