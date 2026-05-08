import { prisma } from "@/lib/prisma";
import { parseHomeHeroBgPaths } from "@/lib/homePageWaveCopy";
import { HomeHeroBackgroundsClient } from "@/components/portal/HomeHeroBackgroundsClient";

export async function HomeHeroBackgroundsSection({
  className,
  embedded,
}: {
  className?: string;
  embedded?: boolean;
}) {
  const row = await prisma.siteSetting.findUnique({ where: { key: "HOME_HERO_BG_PATHS" } });
  const paths = parseHomeHeroBgPaths(row?.value);
  return <HomeHeroBackgroundsClient initialPaths={paths} className={className} embedded={embedded} />;
}
