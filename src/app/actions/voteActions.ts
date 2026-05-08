"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const MAP_KEY = "PLAYLIST_VOTES_MAP";
const LOG_KEY = "PLAYLIST_VOTES_LOG";
const USER_MAP_KEY = "PLAYLIST_VOTES_USER_MAP";

function assertAdmin(session: any) {
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }
}

export async function resetPlaylistVotes() {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  await Promise.all([
    prisma.siteSetting.upsert({
      where: { key: MAP_KEY },
      update: { value: "{}" },
      create: { key: MAP_KEY, value: "{}" },
    }),
    prisma.siteSetting.upsert({
      where: { key: LOG_KEY },
      update: { value: "[]" },
      create: { key: LOG_KEY, value: "[]" },
    }),
    prisma.siteSetting.upsert({
      where: { key: USER_MAP_KEY },
      update: { value: "{}" },
      create: { key: USER_MAP_KEY, value: "{}" },
    }),
  ]);

  revalidatePath("/admin/stemmen");
  revalidatePath("/playlist");
  return { success: true as const };
}

export async function removeTrackVotes(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const trackId = String(formData.get("trackId") || "");
  if (!trackId) return { success: false as const };

  const [mapRow, logRow, userRow] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: MAP_KEY }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: LOG_KEY }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: USER_MAP_KEY }, select: { value: true } }),
  ]);

  const votes = mapRow?.value ? (JSON.parse(mapRow.value) as Record<string, any>) : {};
  const logs = logRow?.value ? (JSON.parse(logRow.value) as Array<any>) : [];
  const userVotes = userRow?.value ? (JSON.parse(userRow.value) as Record<string, Record<string, number>>) : {};

  delete votes[trackId];
  const filteredLogs = logs.filter((item) => item.trackId !== trackId);
  for (const voterId of Object.keys(userVotes)) {
    if (userVotes[voterId] && trackId in userVotes[voterId]) {
      delete userVotes[voterId][trackId];
    }
  }

  await Promise.all([
    prisma.siteSetting.upsert({
      where: { key: MAP_KEY },
      update: { value: JSON.stringify(votes) },
      create: { key: MAP_KEY, value: JSON.stringify(votes) },
    }),
    prisma.siteSetting.upsert({
      where: { key: LOG_KEY },
      update: { value: JSON.stringify(filteredLogs) },
      create: { key: LOG_KEY, value: JSON.stringify(filteredLogs) },
    }),
    prisma.siteSetting.upsert({
      where: { key: USER_MAP_KEY },
      update: { value: JSON.stringify(userVotes) },
      create: { key: USER_MAP_KEY, value: JSON.stringify(userVotes) },
    }),
  ]);

  revalidatePath("/admin/stemmen");
  revalidatePath("/admin");
  revalidatePath("/playlist");
  return { success: true as const };
}
