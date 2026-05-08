import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allWebsiteTextSettingKeys } from "@/lib/websiteTextsConfig";
import { HOMEPAGE_UI_KEYS } from "@/lib/homepageUiSettingsConfig";
import { SITE_GENERAL_KEYS } from "@/lib/siteGeneralSettingsConfig";
import { WebsiteTekstenEditor } from "@/components/portal/WebsiteTekstenEditor";

export async function WebsiteTekstenForm() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;

  const keys = allWebsiteTextSettingKeys().filter((k) => !HOMEPAGE_UI_KEYS.includes(k) && !SITE_GENERAL_KEYS.includes(k));
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return <WebsiteTekstenEditor initialMap={map} />;
}
