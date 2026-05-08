export type HomeHeroSlide = { src: string };

function assetSrc(imagePath: string) {
  return "/api/assets/" + imagePath.split("/").map(encodeURIComponent).join("/");
}

function isImagePath(p: string | null | undefined) {
  if (!p?.trim()) return false;
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(p);
}

export function uniqueSlideSrcs(
  adminPaths: string[],
  trackCovers: { src: string }[],
  max: number
): HomeHeroSlide[] {
  const seen = new Set<string>();
  const out: HomeHeroSlide[] = [];
  for (const p of adminPaths) {
    if (!isImagePath(p)) continue;
    const src = assetSrc(p);
    if (seen.has(src)) continue;
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
