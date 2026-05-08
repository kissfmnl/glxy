"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_DJ_PERMISSIONS,
  PORTAL_PERMISSION_KEYS,
  normalizePortalPermissions,
  type PortalPermissionKey,
  serializePortalPermissions,
} from "@/lib/portalPermissions";

function parsePermissionSelection(formData: FormData): PortalPermissionKey[] {
  const raw = formData.getAll("permissions").map((v) => String(v));
  return Array.from(new Set(normalizePortalPermissions(raw)));
}

function withRequiredDjPermissions(perms: PortalPermissionKey[]): PortalPermissionKey[] {
  const merged = Array.from(new Set([...perms, ...DEFAULT_DJ_PERMISSIONS]));
  return normalizePortalPermissions(merged);
}

/**
 * Maak een nieuwe DJ of Admin aan.
 * Alleen toegankelijk voor ADMIN gebruikers.
 */
export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "DJ";
  const selectedPermissions = parsePermissionSelection(formData);

  if (!email || !password || !name) {
    throw new Error("Alle velden zijn verplicht");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        permissionsJson: serializePortalPermissions(
          role === "ADMIN"
            ? (selectedPermissions.length ? selectedPermissions : PORTAL_PERMISSION_KEYS)
            : withRequiredDjPermissions(selectedPermissions)
        ),
      },
    });
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[UserActions] Fout bij aanmaken gebruiker:", error);
    return { error: "E-mailadres is waarschijnlijk al in gebruik." };
  }
}

/**
 * Verwijder een gebruiker.
 */
export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }

  // Voorkom dat een admin zichzelf verwijdert
  if (userId === (session.user as any).id) {
    throw new Error("Je kunt jezelf niet verwijderen");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateUser(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const role = String(formData.get("role") || "DJ");
  const password = String(formData.get("password") || "").trim();
  const selectedPermissions = parsePermissionSelection(formData);

  if (!id || !name || !email) {
    throw new Error("Naam en e-mailadres zijn verplicht");
  }

  const data: { name: string; email: string; role: string; password?: string } = {
    name,
    email,
    role,
  };
  if (password.length > 0) {
    data.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...data,
      permissionsJson: serializePortalPermissions(
        role === "ADMIN"
          ? (selectedPermissions.length ? selectedPermissions : PORTAL_PERMISSION_KEYS)
          : withRequiredDjPermissions(selectedPermissions)
      ),
    },
  });

  revalidatePath("/admin");
  return { success: true };
}
