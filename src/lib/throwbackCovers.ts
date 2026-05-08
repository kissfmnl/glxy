function sanitizePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\(feat[^)]*\)/g, "")
    .replace(/\(ft[^)]*\)/g, "")
    .replace(/\sfeat\.?\s.+$/g, "")
    .replace(/\sft\.?\s.+$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTrackKeys(artist: string, title: string): string[] {
  const a = sanitizePart(artist);
  const t = sanitizePart(title);
  if (!a || !t) return [];
  const keys = new Set<string>();
  keys.add(`${a}|${t}`);
  keys.add(`${a.replace(/\sand\s/g, " & ")}|${t}`);
  keys.add(`${a.replace(/\s&\s/g, " and ")}|${t}`);
  keys.add(`${a}|${t.replace(/\s-\s/g, " ")}`);
  return Array.from(keys).filter(Boolean);
}

export function toPublicCoverSrc(raw: string | null | undefined): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  if (value.startsWith("Website/")) {
    return "/api/assets/" + value.split("/").map(encodeURIComponent).join("/");
  }
  return null;
}
