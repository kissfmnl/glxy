"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import type { PlayerUiConfig } from "@/lib/playerUi";
import { DEFAULT_PLAYER_UI } from "@/lib/playerUi";
import { prisma } from "@/lib/prisma";
import { isPortalAdmin } from "@/lib/authRoles";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) {
    throw new Error("Geen rechten.");
  }
}

function pickHex(formData: FormData, key: keyof PlayerUiConfig): string {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return DEFAULT_PLAYER_UI[key];
  return raw;
}

export async function updatePlayerUiAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Geen rechten." };
  }

  const playerUi: PlayerUiConfig = {
    stationPlayHex: pickHex(formData, "stationPlayHex"),
    stationTextHex: pickHex(formData, "stationTextHex"),
    stationSubtextHex: pickHex(formData, "stationSubtextHex"),
    miniBgHex: pickHex(formData, "miniBgHex"),
    miniTextHex: pickHex(formData, "miniTextHex"),
    miniMutedHex: pickHex(formData, "miniMutedHex"),
    miniAccentHex: pickHex(formData, "miniAccentHex"),
    miniPlayIconHex: pickHex(formData, "miniPlayIconHex"),
    miniVolThumbHex: pickHex(formData, "miniVolThumbHex"),
    miniBorderHex: pickHex(formData, "miniBorderHex"),
    heroVolThumbHex: pickHex(formData, "heroVolThumbHex"),
    heroControlSurfaceHex: pickHex(formData, "heroControlSurfaceHex"),
    heroControlIconHex: pickHex(formData, "heroControlIconHex"),
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
        playerUi,
      },
      update: { playerUi },
    });
  } catch (e) {
    console.error("[updatePlayerUiAction]", e);
    return { error: "Opslaan mislukt." };
  }

  revalidatePath("/");
  revalidatePath("/admin/player-ui");
  return { ok: true };
}
