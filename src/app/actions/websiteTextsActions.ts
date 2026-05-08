"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  allWebsiteTextSettingKeys,
  websiteTextGroups,
  type WebsiteTextItem,
} from "@/lib/websiteTextsConfig";
import { HOMEPAGE_UI_KEYS } from "@/lib/homepageUiSettingsConfig";
import { SITE_GENERAL_KEYS } from "@/lib/siteGeneralSettingsConfig";

function defaultValueForWebsiteTextKey(key: string): string {
  for (const group of websiteTextGroups) {
    for (const raw of group.items) {
      const item = raw as WebsiteTextItem;
      if (item.key === key) return item.fallback;
      if (item.pairedYesNoVisibilityKey === key) return "yes";
    }
  }
  return "";
}

function assertAdmin(session: any) {
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }
}

export async function saveWebsiteTexts(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const keys = allWebsiteTextSettingKeys().filter((k) => !HOMEPAGE_UI_KEYS.includes(k) && !SITE_GENERAL_KEYS.includes(k));
  await Promise.all(
    keys.map((key) => {
      const fallback = defaultValueForWebsiteTextKey(key);
      const raw = formData.get(key);
      const value = String(raw !== null && raw !== undefined && raw !== "" ? raw : fallback);
      return prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    })
  );

  revalidatePath("/settings");
  revalidatePath("/settings/website-teksten");
  revalidatePath("/");
  revalidatePath("/kiss40");
  revalidatePath("/playlist");
  revalidatePath("/frequenties");
  revalidatePath("/djs");
  revalidatePath("/admin/studio");
  revalidatePath("/home-classic");
  revalidatePath("/contact");
  revalidatePath("/programmering");
  revalidatePath("/giveaway-voorwaarden");
  revalidatePath("/join-kiss");
  redirect("/settings/website-teksten?saved=1");
}
