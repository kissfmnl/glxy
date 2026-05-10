"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPortalAdmin } from "@/lib/authRoles";
import { mergeNpWordFilter } from "@/lib/npWordFilter";

export async function updateNpWordFilterAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) {
    return { error: "Geen rechten." };
  }

  const raw = String(formData.get("npPhrases") ?? "");
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const merged = mergeNpWordFilter({ phrases: lines });

  try {
    await prisma.branding.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        npWordFilter: merged as object,
      },
      update: {
        npWordFilter: merged as object,
      },
    });
  } catch {
    return { error: "Opslaan mislukt." };
  }

  revalidatePath("/");
  revalidatePath("/programmering");
  revalidatePath("/admin/player-ui");
  return { ok: true };
}
