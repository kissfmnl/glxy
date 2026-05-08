"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_JOIN_BENEFITS,
  DEFAULT_JOIN_VACANCIES,
  JOIN_KISS_SLOTS,
  type JoinKissSlot,
} from "@/lib/joinKissDefaults";

function assertAdmin(session: any) {
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }
}


export async function seedJoinKissDefaults() {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const vacCount = await prisma.joinKissVacancy.count();
  if (vacCount === 0) {
    await prisma.joinKissVacancy.createMany({
      data: DEFAULT_JOIN_VACANCIES.map((v) => ({
        slot: v.slot,
        title: v.title,
        category: v.category,
        location: v.location,
        jobType: v.jobType,
        description: v.description,
        requirements: v.requirements,
        applyLabel: v.applyLabel,
        applyUrl: v.applyUrl,
        sortOrder: v.sortOrder,
        isActive: true,
      })),
    });
  }

  const benCount = await prisma.joinKissBenefit.count();
  if (benCount === 0) {
    await prisma.joinKissBenefit.createMany({
      data: DEFAULT_JOIN_BENEFITS.map((b) => ({
        title: b.title,
        body: b.body,
        sortOrder: b.sortOrder,
        isActive: true,
      })),
    });
  }

  revalidatePath("/join-kiss");
  revalidatePath("/settings/join-kiss");
  return { success: true as const };
}

export type JoinKissVacancyPayload = {
  title: string;
  category: string;
  location: string;
  jobType: string;
  imagePath: string;
  description: string;
  requirements: string;
  applyLabel: string;
  applyUrl: string;
  isActive: boolean;
};

export async function saveJoinKissVacancies(payload: Record<JoinKissSlot, JoinKissVacancyPayload>) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  for (const slot of JOIN_KISS_SLOTS) {
    const p = payload[slot];
    if (!p) continue;
    await prisma.joinKissVacancy.upsert({
      where: { slot },
      create: {
        slot,
        title: p.title.trim() || "Vacature",
        category: p.category.trim(),
        location: p.location.trim(),
        jobType: p.jobType.trim(),
        imagePath: p.imagePath.trim() || null,
        description: p.description.trim(),
        requirements: p.requirements.trim(),
        applyLabel: p.applyLabel.trim() || "Solliciteer",
        applyUrl: p.applyUrl.trim() || "mailto:info@kissfm.nl",
        isActive: p.isActive,
        sortOrder: JOIN_KISS_SLOTS.indexOf(slot),
      },
      update: {
        title: p.title.trim() || "Vacature",
        category: p.category.trim(),
        location: p.location.trim(),
        jobType: p.jobType.trim(),
        imagePath: p.imagePath.trim() || null,
        description: p.description.trim(),
        requirements: p.requirements.trim(),
        applyLabel: p.applyLabel.trim() || "Solliciteer",
        applyUrl: p.applyUrl.trim() || "mailto:info@kissfm.nl",
        isActive: p.isActive,
        sortOrder: JOIN_KISS_SLOTS.indexOf(slot),
      },
    });
  }

  revalidatePath("/join-kiss");
  revalidatePath("/settings/join-kiss");
  return { success: true as const };
}

export async function saveJoinKissBenefits(items: { title: string; body: string }[]) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  await prisma.$transaction(async (tx) => {
    await tx.joinKissBenefit.deleteMany({});
    let order = 0;
    for (const row of items) {
      const title = row.title.trim();
      if (!title) continue;
      await tx.joinKissBenefit.create({
        data: {
          title,
          body: row.body.trim(),
          sortOrder: order++,
          isActive: true,
        },
      });
    }
  });

  revalidatePath("/join-kiss");
  revalidatePath("/settings/join-kiss");
  return { success: true as const };
}
