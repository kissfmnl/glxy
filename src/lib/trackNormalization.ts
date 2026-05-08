/** Normaliseert artiest/titel voor vergelijking en dedupe. */

export function normTrackPart(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s*(?:feat\.?|ft\.?|featuring)\s+/gi, " ft ");
}

export function trackKeyNorm(artist: string, title: string) {
  return `${normTrackPart(artist)}|${normTrackPart(title)}`;
}
