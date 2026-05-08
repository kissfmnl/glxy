import { getHomePageLayout } from "@/lib/homePageLayout";
import { HomeClassicLayout } from "@/components/public/HomeClassicLayout";
import { HomeWaveLayout, type HomeImageTile } from "@/components/public/HomeWaveLayout";
import { uniqueSlideSrcs } from "@/lib/homeHeroBackdropData";
import { loadHomeWavePageData } from "@/lib/homePageWaveCopy";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function assetSrc(imagePath: string) {
  return "/api/assets/" + imagePath.split("/").map(encodeURIComponent).join("/");
}

function isImagePath(p: string | null | undefined) {
  if (!p?.trim()) return false;
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(p);
}

export default async function PublicHomePage() {
  const variant = await getHomePageLayout();
  if (variant === "classic") return <HomeClassicLayout />;

  const [{ copy, heroBgPaths }, jocks, playedWithCover] = await Promise.all([
    loadHomeWavePageData(),
    prisma.jock.findMany({
      where: {
        isActive: true,
        imagePath: { not: null },
        NOT: [
          { name: { equals: "nonstop", mode: "insensitive" } },
          { name: { equals: "non-stop", mode: "insensitive" } },
          { name: { equals: "kiss nonstop", mode: "insensitive" } },
          { name: { equals: "kiss non-stop", mode: "insensitive" } },
        ],
      },
      take: 16,
      orderBy: { name: "asc" },
      select: { name: true, imagePath: true, imageFocusX: true, imageFocusY: true, slug: true },
    }),
    prisma.playedTrack.findMany({
      where: { cover: { not: null } },
      orderBy: { playedAt: "desc" },
      take: 24,
      select: { title: true, artist: true, cover: true },
    }),
  ]);

  const djPhotos: HomeImageTile[] = jocks
    .filter((j): j is typeof j & { imagePath: string } => isImagePath(j.imagePath))
    .map((j) => ({
      src: assetSrc(j.imagePath),
      alt: j.name,
      slug: j.slug,
      focalX: j.imageFocusX,
      focalY: j.imageFocusY,
    }));

  const trackCovers: HomeImageTile[] = playedWithCover
    .filter((t) => t.cover && /^https?:\/\//i.test(t.cover))
    .map((t) => ({
      src: t.cover as string,
      alt: `${t.artist} — ${t.title}`,
    }));

  const heroBackdropSlides = uniqueSlideSrcs(heroBgPaths, trackCovers, 24);

  return (
    <HomeWaveLayout
      copy={copy}
      heroBackdropSlides={heroBackdropSlides}
      trackCovers={trackCovers}
      djPhotos={djPhotos}
    />
  );
}
