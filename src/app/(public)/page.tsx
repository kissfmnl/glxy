import { getHomePageLayout } from "@/lib/homePageLayout";
import { HomeClassicLayout } from "@/components/public/HomeClassicLayout";
import { HomeWaveLayout, type HomeImageTile } from "@/components/public/HomeWaveLayout";
import { uniqueSlideSrcs } from "@/lib/homeHeroBackdropData";
import { loadHomeWavePageData } from "@/lib/homePageWaveCopy";
import { MOCK_JOCKS, MOCK_PLAYED_TRACKS } from "@/lib/mock/site";

export default async function PublicHomePage() {
  const variant = await getHomePageLayout();
  if (variant === "classic") return <HomeClassicLayout />;

  const { copy, heroBgPaths } = await loadHomeWavePageData();

  const djPhotos: HomeImageTile[] = MOCK_JOCKS.map((j) => ({
    src: j.imagePath,
    alt: j.name,
    slug: j.slug,
    focalX: j.imageFocusX,
    focalY: j.imageFocusY,
  }));

  const trackCovers: HomeImageTile[] = MOCK_PLAYED_TRACKS.filter((t) => t.cover).map((t) => ({
    src: t.cover!,
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
