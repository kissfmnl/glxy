"use server";

import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/authRoles";

function parseRole(raw: string): Role | null {
  const u = raw.trim().toUpperCase();
  if (u === "DJ") return Role.DJ;
  if (u === "ADMIN") return Role.ADMIN;
  if (u === "SUPER_ADMIN") return Role.SUPER_ADMIN;
  return null;
}

export async function updateUserRoleAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isSuperAdmin(session.user.role)) {
    return { error: "Alleen een super-admin kan rollen wijzigen." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const role = parseRole(String(formData.get("role") ?? ""));
  if (!userId || !role) {
    return { error: "Ongeldige invoer." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  } catch {
    return { error: "Gebruiker niet gevonden of niet bijgewerkt." };
  }

  revalidatePath("/admin/gebruikers");
  return { ok: true };
}
