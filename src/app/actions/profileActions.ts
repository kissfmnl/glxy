"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Niet geautoriseerd" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name, email },
    });
    
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Fout bij bijwerken profiel:", error);
    return { error: "Kon profiel niet bijwerken. E-mail is mogelijk al in gebruik." };
  }
}
