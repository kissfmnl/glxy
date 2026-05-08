import { prisma } from "@/lib/prisma";

export type HomePageLayoutVariant = "classic" | "wave";

export async function getHomePageLayout(): Promise<HomePageLayoutVariant> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "HOME_PAGE_LAYOUT" },
      select: { value: true },
    });
    const v = (row?.value || "wave").trim().toLowerCase();
    return v === "classic" ? "classic" : "wave";
  } catch {
    return "wave";
  }
}
