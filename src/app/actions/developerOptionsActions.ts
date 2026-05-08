"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateMockMessagesPreference(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Niet geautoriseerd" };
  }

  const showMockMessages = formData.get("showMockMessages") === "on";

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { showMockMessages },
    });
    revalidatePath("/settings");
    revalidatePath("/settings/developer");
    return { success: true as const };
  } catch (e) {
    console.error("Developer options update error:", e);
    return { error: "Opslaan mislukt." };
  }
}
