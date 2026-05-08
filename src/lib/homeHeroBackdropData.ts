export type HomeHeroSlide = { src: string };

function resolveBackdropSrc(imagePath: string): string | null {
  const t = imagePath.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return null;
}

export function uniqueSlideSrcs(
  adminPaths: string[],
  trackCovers: { src: string }[],
  max: number
): HomeHeroSlide[] {
  const seen = new Set<string>();
  const out: HomeHeroSlide[] = [];
  for (const p of adminPaths) {
    const src = resolveBackdropSrc(p);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    out.push({ src });
    if (out.length >= max) return out;
  }
  for (const t of trackCovers) {
    if (!t.src || seen.has(t.src)) continue;
    seen.add(t.src);
    out.push({ src: t.src });
    if (out.length >= max) break;
  }
  return out;
}
