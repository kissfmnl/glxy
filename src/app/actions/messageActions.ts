"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Markeer een bericht als gelezen of ongelezen.
 */
export async function markAsRead(id: string, isRead: boolean) {
  await prisma.message.update({
    where: { id },
    data: { isRead },
  });
  revalidatePath("/whatsapp");
  revalidatePath("/dashboard");
}

/**
 * Zet de gepinde status van een bericht aan of uit.
 */
export async function togglePin(id: string, isPinned: boolean) {
  await prisma.message.update({
    where: { id },
    data: { isPinned },
  });
  revalidatePath("/whatsapp");
}
