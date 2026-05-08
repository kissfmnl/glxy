import type { HomePageLayoutVariant } from "@/types/home-wave";

/** Static GLXY fork: homepage uses wave hero only (no CMS). */

export async function getHomePageLayout(): Promise<HomePageLayoutVariant> {
  return "wave";
}
