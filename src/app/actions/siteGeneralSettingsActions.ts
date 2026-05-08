"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SITE_GENERAL_SETTINGS } from "@/lib/siteGeneralSettingsConfig";
import path from "path";
import { writeUnderWebsite } from "@/lib/websiteDisk";
import { redirect } from "next/navigation";

function assertAdmin(session: unknown) {
  if (!session || ((session as { user?: { role?: string } }).user?.role !== "ADMIN")) {
    throw new Error("Niet geautoriseerd");
  }
}

export async function saveSiteGeneralSettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  let fallbackLogoPath = String(formData.get("FALLBACK_ALBUM_LOGO_SELECT") || "").trim();
  if (!fallbackLogoPath) {
    const current = await prisma.siteSetting.findUnique({ where: { key: "FALLBACK_ALBUM_LOGO_PATH" }, select: { value: true } });
    fallbackLogoPath = current?.value?.trim() || "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png";
  }

  const upload = (formData.get("FALLBACK_ALBUM_LOGO_UPLOAD") as File | null) || null;
  if (upload && upload.size > 0) {
    const ext = path.extname(upload.name || "").toLowerCase() || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg", ".ico"].includes(ext) ? ext : ".png";
    const fileName = `fallback-album-logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
    fallbackLogoPath = await writeUnderWebsite(
      ["uploads", fileName],
      Buffer.from(await upload.arrayBuffer())
    );
  }

  let faviconPath = String(formData.get("SITE_FAVICON_SELECT") || "").trim();
  if (!faviconPath) {
    const current = await prisma.siteSetting.findUnique({ where: { key: "SITE_FAVICON_PATH" }, select: { value: true } });
    faviconPath = current?.value?.trim() || "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png";
  }
  const faviconUpload = (formData.get("SITE_FAVICON_UPLOAD") as File | null) || null;
  if (faviconUpload && faviconUpload.size > 0) {
    const ext = path.extname(faviconUpload.name || "").toLowerCase() || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg", ".ico"].includes(ext) ? ext : ".png";
    const fileName = `favicon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
    faviconPath = await writeUnderWebsite(
      ["uploads", fileName],
      Buffer.from(await faviconUpload.arrayBuffer())
    );
  }

  await Promise.all(
    SITE_GENERAL_SETTINGS.map((item) => {
      const raw =
        item.key === "FALLBACK_ALBUM_LOGO_PATH"
          ? fallbackLogoPath
          : item.key === "SITE_FAVICON_PATH"
            ? faviconPath
            : formData.get(item.key);
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
  revalidatePath("/settings/site/general");
  revalidatePath("/settings/homepage");
  revalidatePath("/api/favicon");
  redirect("/settings/site/general?saved=1");
}
