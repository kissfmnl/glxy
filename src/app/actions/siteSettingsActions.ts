"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const NOW_PLAYING_DELAY_KEY = "NOW_PLAYING_DELAY_SECONDS";
const KISS40_DESCRIPTION_KEY = "KISS40_DESCRIPTION";
const DEFAULT_DELAY_SECONDS = 30;
const DEFAULT_KISS40_DESCRIPTION =
  "Elk weekend vanaf 16:00 uur hoor je Bas van Teylingen met de 40 grootste hits van het moment in de KISS40. Samengesteld door jou via de KISS app, website en sociale media.";

function clampDelay(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_DELAY_SECONDS;
  return Math.min(Math.max(Math.round(value), 0), 300);
}

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  if (!isAdmin) throw new Error("Niet geautoriseerd");
}

export async function getSiteSettings() {
  await assertAdmin();
  const [delayRow, kiss40Row] = await Promise.all([
    prisma.siteSetting.findUnique({
      where: { key: NOW_PLAYING_DELAY_KEY },
      select: { value: true },
    }),
    prisma.siteSetting.findUnique({
      where: { key: KISS40_DESCRIPTION_KEY },
      select: { value: true },
    }),
  ]);
  const parsed = delayRow ? Number(delayRow.value) : DEFAULT_DELAY_SECONDS;
  return {
    nowPlayingDelaySeconds: clampDelay(parsed),
    kiss40Description: kiss40Row?.value || DEFAULT_KISS40_DESCRIPTION,
  };
}

export async function updateSiteSettings(formData: FormData) {
  await assertAdmin();
  const raw = Number(formData.get("nowPlayingDelaySeconds") || DEFAULT_DELAY_SECONDS);
  const nowPlayingDelaySeconds = clampDelay(raw);

  await prisma.siteSetting.upsert({
    where: { key: NOW_PLAYING_DELAY_KEY },
    update: { value: String(nowPlayingDelaySeconds) },
    create: { key: NOW_PLAYING_DELAY_KEY, value: String(nowPlayingDelaySeconds) },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/homepage");
  revalidatePath("/");
  revalidatePath("/playlist");
  revalidatePath("/kiss40");
  return { success: true as const };
}
