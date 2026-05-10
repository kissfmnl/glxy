"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/authRoles";
import type { AdminPortalCopy } from "@/lib/adminPortalCopy";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function updateAdminPortalCopyAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isSuperAdmin(session.user.role)) {
    return { error: "Alleen super-admin kan portalteksten aanpassen." };
  }

  const stationsIntroHtml = String(formData.get("stationsIntroHtml") ?? "");
  const brandingIntroHtml = String(formData.get("brandingIntroHtml") ?? "");
  const playerUiIntroHtml = String(formData.get("playerUiIntroHtml") ?? "");

  const payload: AdminPortalCopy = {
    stationsIntroHtml,
    brandingIntroHtml,
    playerUiIntroHtml,
  };

  try {
    await prisma.branding.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        primaryHex: "#0b7557",
        accentHex: "#6d6d6d",
        navyHex: "#363636",
        yellowHex: "#ffe200",
        adminPortalCopy: payload as Prisma.InputJsonValue,
      },
      update: { adminPortalCopy: payload as Prisma.InputJsonValue },
    });
  } catch (e) {
    console.error("[updateAdminPortalCopyAction]", e);
    return { error: "Opslaan mislukt." };
  }

  revalidatePath("/admin/stations");
  revalidatePath("/admin/branding");
  revalidatePath("/admin/player-ui");
  revalidatePath("/admin/portal-teksten");
  return { ok: true };
}
