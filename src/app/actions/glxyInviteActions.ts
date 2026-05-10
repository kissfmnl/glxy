"use server";

import { Role } from "@prisma/client";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/mail";
import { getPublicAppUrl } from "@/lib/publicAppUrl";
import { isPortalAdmin } from "@/lib/authRoles";

export async function createInviteAction(formData: FormData): Promise<{ ok?: true; inviteUrl?: string; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) {
    return { error: "Geen rechten." };
  }
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawRole = String(formData.get("role") ?? "DJ").toUpperCase();
  const role = rawRole === "ADMIN" ? Role.ADMIN : Role.DJ;

  if (!rawEmail.includes("@")) {
    return { error: "Voer een geldig e-mailadres in." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: rawEmail } });
  if (existingUser) {
    return { error: "Er bestaat al een account met dit adres." };
  }

  const openInvite = await prisma.invite.findFirst({
    where: { email: rawEmail, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (openInvite) {
    const inviteUrl = `${getPublicAppUrl()}/invite/${openInvite.token}`;
    return { ok: true, inviteUrl };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.invite.create({
    data: {
      email: rawEmail,
      role,
      token,
      expiresAt,
    },
  });

  const inviteUrl = `${getPublicAppUrl()}/invite/${token}`;
  try {
    await sendInviteEmail(rawEmail, inviteUrl);
  } catch {
    /* SMTP mislukt: link tonen in UI */
  }

  revalidatePath("/admin/gebruikers");
  return { ok: true, inviteUrl };
}

export async function acceptInviteAction(
  token: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || undefined;

  if (!token) return { error: "Ongeldige uitnodiging." };
  if (password.length < 8) return { error: "Wachtwoord moet minstens 8 tekens zijn." };

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.usedAt) return { error: "Deze uitnodiging is niet meer geldig." };
  if (invite.expiresAt < new Date()) return { error: "Deze link is verlopen. Vraag een nieuwe uitnodiging." };

  const exists = await prisma.user.findUnique({ where: { email: invite.email } });
  if (exists) return { error: "Er bestaat al een account met dit e-mailadres." };

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invite.email,
        passwordHash,
        role: invite.role,
        name,
      },
    }),
    prisma.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
