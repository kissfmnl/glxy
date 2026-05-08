/** Gedeelde checks voor now-playing feed en playlist-cron. */

export function isMeaningfulText(s: unknown) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  const lowered = t.toLowerCase();
  return lowered !== "onbekend" && lowered !== "station id";
}

export function isBlockedFeedItem(title?: string, artist?: string) {
  const blob = `${title || ""} ${artist || ""}`.trim().toLowerCase().replace(/\s+/g, " ");
  return blob.includes("dummy block item") || blob.replace(/\s/g, "").includes("dummyblockitem");
}

export function isGarbageNext(n: { title?: string; artist?: string } | undefined | null) {
  if (!n) return true;
  if (isBlockedFeedItem(n.title, n.artist)) return true;
  return !isMeaningfulText(n.title) || !isMeaningfulText(n.artist);
}
