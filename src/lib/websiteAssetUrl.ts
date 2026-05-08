/** Publieke URL voor bestanden onder `Website/` (api/assets route). */
export function websiteAssetUrl(rel: string | null | undefined): string | null {
  const raw = (rel ?? "").trim().replace(/\\/g, "/");
  if (!raw) return null;
  const noLead = raw.replace(/^\/+/, "");
  const normalized = noLead.startsWith("Website/") ? noLead : `Website/${noLead}`;
  return "/api/assets/" + normalized.split("/").map(encodeURIComponent).join("/");
}
