"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { mergeStationsConfig } from "@/lib/stationsConfigMerge";
import { isPortalAdmin } from "@/lib/authRoles";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) {
    throw new Error("Geen rechten.");
  }
}

export async function updateStationsAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Geen rechten." };
  }

  const prev = await prisma.branding.findUnique({ where: { id: 1 } });
  const stationsRaw = String(formData.get("stationsJson") ?? "").trim();
  const stationsMerged = stationsRaw ? await mergeStationsConfig(stationsRaw, prev?.stationsConfig) : undefined;

  let stationColors: Prisma.InputJsonValue | null = null;
  try {
    const raw = String(formData.get("stationColorsJson") ?? "").trim();
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        stationColors = parsed as Prisma.InputJsonValue;
      }
    }
  } catch {
    stationColors = null;
  }

  try {
    await prisma.branding.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        primaryHex: "#0b7557",
        accentHex: "#6d6d6d",
        navyHex: "#363636",
        yellowHex: "#ffe200",
        stationsConfig: stationsMerged ?? undefined,
        stationColors: stationColors === null ? undefined : stationColors,
      },
      update: {
        ...(stationsMerged !== undefined ? { stationsConfig: stationsMerged } : {}),
        ...(stationColors !== null ? { stationColors } : {}),
      },
    });
  } catch (e) {
    console.error("[updateStationsAction]", e);
    return { error: "Opslaan mislukt." };
  }

  revalidatePath("/");
  revalidatePath("/admin/stations");
  return { ok: true };
}
