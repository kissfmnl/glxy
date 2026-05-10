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
    titleBgHex: normalizeOptionalHex(String(formData.get("jpTitleBgHex") ?? "")) ?? undefined,
    titleTextHex: normalizeOptionalHex(String(formData.get("jpTitleTextHex") ?? "")) ?? undefined,
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
