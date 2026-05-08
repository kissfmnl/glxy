"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeUnderWebsite } from "@/lib/websiteDisk";
import { redirect } from "next/navigation";
import { syncConcertsFromTicketmaster } from "@/lib/concertSync";

function assertAdmin(session: any) {
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }
}

function parseDateTimeLocal(input: string) {
  // input: "YYYY-MM-DDTHH:mm"
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error("Datum/tijd ongeldig.");
  return d;
}

async function saveUpload(file: File | null) {
  if (!file || file.size === 0) return null;
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".avif"].includes(ext) ? ext : ".jpg";
  const fileName = `concert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeUnderWebsite(["uploads", fileName], bytes);
}

export async function upsertConcert(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const id = (formData.get("id") as string | null) || null;
  const title = (formData.get("title") as string | null)?.trim() || "";
  const venue = (formData.get("venue") as string | null)?.trim() || null;
  const city = (formData.get("city") as string | null)?.trim() || null;
  const dateInput = (formData.get("date") as string | null)?.trim() || "";
  const url = (formData.get("url") as string | null)?.trim() || null;
  const imagePathInput = (formData.get("imagePath") as string | null)?.trim() || null;
  const uploadedImage = await saveUpload((formData.get("imageFile") as File | null) || null);
  const imagePath = uploadedImage || imagePathInput;
  const isActive = formData.get("isActive") === "on";

  if (!title) return { success: false as const, error: "Titel is verplicht." };
  if (!dateInput) return { success: false as const, error: "Datum/tijd is verplicht." };

  let date: Date;
  try {
    date = parseDateTimeLocal(dateInput);
  } catch (e: any) {
    return { success: false as const, error: e?.message || "Datum/tijd ongeldig." };
  }

  if (id) {
    await prisma.concert.update({
      where: { id },
      data: { title, venue, city, date, url, imagePath, isActive },
    });
  } else {
    await prisma.concert.create({
      data: { title, venue, city, date, url, imagePath, isActive },
    });
  }

  revalidatePath("/concerten");
  revalidatePath("/");
  revalidatePath("/admin/concerten");
  revalidatePath("/settings/concerten");
  return { success: true as const };
}

export async function deleteConcert(concertId: string) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const concert = await prisma.concert.findUnique({
    where: { id: concertId },
    select: { id: true, externalKey: true, source: true, title: true },
  });
  if (!concert) return { success: true as const };

  if (concert.externalKey && concert.source === "ticketmaster") {
    await prisma.concertSyncBlock.upsert({
      where: { externalKey: concert.externalKey },
      create: {
        externalKey: concert.externalKey,
        source: "ticketmaster",
        reason: `Handmatig verwijderd: ${concert.title}`,
      },
      update: {},
    });
  }

  await prisma.concert.delete({ where: { id: concertId } });
  revalidatePath("/concerten");
  revalidatePath("/");
  revalidatePath("/admin/concerten");
  revalidatePath("/settings/concerten");
  return { success: true as const };
}

export async function setConcertVisibility(concertId: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  await prisma.concert.update({
    where: { id: concertId },
    data: { isActive },
  });

  revalidatePath("/concerten");
  revalidatePath("/");
  revalidatePath("/admin/concerten");
  revalidatePath("/settings/concerten");
  return { success: true as const };
}

export async function runConcertSyncNow() {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  try {
    const result = await syncConcertsFromTicketmaster();
    revalidatePath("/concerten");
    revalidatePath("/");
    revalidatePath("/settings/concerten");
    redirect(`/settings/concerten?synced=${result.upserted}`);
  } catch (e: any) {
    if (String(e?.digest || "").startsWith("NEXT_REDIRECT")) throw e;
    const msg = encodeURIComponent(String(e?.message || "Concert-sync mislukt"));
    redirect(`/settings/concerten?syncError=${msg}`);
  }
}

