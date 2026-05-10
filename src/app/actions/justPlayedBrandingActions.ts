"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPortalAdmin } from "@/lib/authRoles";
import { mergeJustPlayedConfig, type JustPlayedConfigInput } from "@/lib/justPlayedConfig";

function normalizeOptionalHex(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let t = s.startsWith("#") ? s : `#${s}`;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (!m) return null;
  return `#${m[1]!.length === 3 ? m[1]!.split("").map((c) => c + c).join("") : m[1]!}`.toLowerCase();
}

export async function updateJustPlayedBrandingAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) {
    return { error: "Geen rechten." };
  }

  const input: JustPlayedConfigInput = {
    sectionTitleHex: normalizeOptionalHex(String(formData.get("jpSectionTitleHex") ?? "")) ?? undefined,
    sectionAccentHex: normalizeOptionalHex(String(formData.get("jpSectionAccentHex") ?? "")) ?? undefined,
    panelSurfaceHex: normalizeOptionalHex(String(formData.get("jpPanelSurfaceHex") ?? "")) ?? undefined,
    panelBorderHex: normalizeOptionalHex(String(formData.get("jpPanelBorderHex") ?? "")) ?? undefined,
    stationTabSelectedBgHex: normalizeOptionalHex(String(formData.get("jpStationTabSelectedBgHex") ?? "")) ?? undefined,
    stationTabSelectedTextHex: normalizeOptionalHex(String(formData.get("jpStationTabSelectedTextHex") ?? "")) ?? undefined,
    stationTabInactiveBgHex: normalizeOptionalHex(String(formData.get("jpStationTabInactiveBgHex") ?? "")) ?? undefined,
    stationTabInactiveBorderHex: normalizeOptionalHex(String(formData.get("jpStationTabInactiveBorderHex") ?? "")) ?? undefined,
    playlistLinkHex: normalizeOptionalHex(String(formData.get("jpPlaylistLinkHex") ?? "")) ?? undefined,
  };

  const merged = mergeJustPlayedConfig(input as unknown);

  try {
    await prisma.branding.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        justPlayedConfig: merged as object,
      },
      update: {
        justPlayedConfig: merged as object,
      },
    });
  } catch {
    return { error: "Opslaan mislukt." };
  }

  revalidatePath("/");
  revalidatePath("/admin/just-played");
  return { ok: true };
}
