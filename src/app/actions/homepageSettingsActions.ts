"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { HOMEPAGE_UI_SETTINGS } from "@/lib/homepageUiSettingsConfig";
import { redirect } from "next/navigation";

function assertAdmin(session: unknown) {
  if (!session || ((session as { user?: { role?: string } }).user?.role !== "ADMIN")) {
    throw new Error("Niet geautoriseerd");
  }
}

export async function saveHomepageSettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  await Promise.all(
    HOMEPAGE_UI_SETTINGS.map((item) => {
      const raw = formData.get(item.key);
      const value = String(raw !== null && raw !== undefined && raw !== "" ? raw : item.fallback);
      return prisma.siteSetting.upsert({
        where: { key: item.key },
        update: { value },
        create: { key: item.key, value },
      });
    })
  );

  revalidatePath("/");
  revalidatePath("/playlist");
  revalidatePath("/settings/homepage");
  revalidatePath("/settings/website-teksten");
  redirect("/settings/homepage?saved=1");
}
