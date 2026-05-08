"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function assertAdmin(session: unknown) {
  const s = session as { user?: { role?: string } } | null;
  if (!s?.user || s.user.role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }
}

function coerceDate(v: unknown): Date {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  throw new Error("Ongeldige datum in backup");
}

function asRecordArray(v: unknown, key: string): Record<string, unknown>[] {
  if (!Array.isArray(v)) throw new Error(`Backup mist array: ${key}`);
  return v.filter((x): x is Record<string, unknown> => x && typeof x === "object");
}

export async function importSiteBackup(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const confirm = formData.get("importConfirm") === "on";
  if (!confirm) {
    return { success: false as const, error: "Vink de bevestiging aan om te importeren." };
  }

  const file = formData.get("backupFile");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "Kies een backup-bestand (.json)." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { success: false as const, error: "Kon JSON niet lezen." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { success: false as const, error: "Ongeldig backupbestand." };
  }

  const root = parsed as Record<string, unknown>;
  if (root.version !== 1) {
    return { success: false as const, error: "Alleen backup versie 1 wordt ondersteund." };
  }

  const jocks = asRecordArray(root.jocks, "jocks");
  const siteSettings = asRecordArray(root.siteSettings, "siteSettings");
  const scheduleSlots = asRecordArray(root.scheduleSlots, "scheduleSlots");
  const scheduleTemporarySlots = asRecordArray(root.scheduleTemporarySlots, "scheduleTemporarySlots");
  const homeHeroHeadlineSlots = asRecordArray(root.homeHeroHeadlineSlots, "homeHeroHeadlineSlots");
  const joinKissVacancies = asRecordArray(root.joinKissVacancies, "joinKissVacancies");
  const joinKissBenefits = asRecordArray(root.joinKissBenefits, "joinKissBenefits");
  const kiss40Weeks = asRecordArray(root.kiss40Weeks, "kiss40Weeks");
  const concerts = asRecordArray(root.concerts, "concerts");
  const concertSyncBlocks = asRecordArray(root.concertSyncBlocks, "concertSyncBlocks");
  const studioBookings = asRecordArray(root.studioBookings, "studioBookings");

  try {
  await prisma.$transaction(async (tx) => {
    await tx.scheduleTemporarySlot.deleteMany();
    await tx.scheduleSlot.deleteMany();
    await tx.studioBooking.deleteMany();
    await tx.kiss40Week.deleteMany();
    await tx.concert.deleteMany();
    await tx.concertSyncBlock.deleteMany();
    await tx.homeHeroHeadlineSlot.deleteMany();
    await tx.joinKissBenefit.deleteMany();
    await tx.joinKissVacancy.deleteMany();
    await tx.siteSetting.deleteMany();
    await tx.jock.deleteMany();

    for (const row of jocks) {
      await tx.jock.create({
        data: {
          id: String(row.id),
          name: String(row.name),
          slug: String(row.slug),
          imagePath: row.imagePath == null ? null : String(row.imagePath),
          profileImagePath: row.profileImagePath == null ? null : String(row.profileImagePath),
          isActive: Boolean(row.isActive),
          bioText: row.bioText == null ? null : String(row.bioText),
          personalFactsJson: row.personalFactsJson == null ? null : String(row.personalFactsJson),
          cardQuote: row.cardQuote == null ? null : String(row.cardQuote),
        },
      });
    }

    for (const row of siteSettings) {
      await tx.siteSetting.create({
        data: {
          key: String(row.key),
          value: String(row.value),
        },
      });
    }

    for (const row of scheduleSlots) {
      await tx.scheduleSlot.create({
        data: {
          id: String(row.id),
          dayOfWeek: Number(row.dayOfWeek),
          startTime: String(row.startTime),
          endTime: String(row.endTime),
          label: row.label == null ? null : String(row.label),
          notes: row.notes == null ? null : String(row.notes),
          coHostName: row.coHostName == null ? null : String(row.coHostName),
          programImagePath: row.programImagePath == null ? null : String(row.programImagePath),
          jockId: String(row.jockId),
        },
      });
    }

    for (const row of scheduleTemporarySlots) {
      await tx.scheduleTemporarySlot.create({
        data: {
          id: String(row.id),
          startsOn: coerceDate(row.startsOn),
          endsOn: coerceDate(row.endsOn),
          dayOfWeek: Number(row.dayOfWeek),
          startTime: String(row.startTime),
          endTime: String(row.endTime),
          label: row.label == null ? null : String(row.label),
          notes: row.notes == null ? null : String(row.notes),
          coHostName: row.coHostName == null ? null : String(row.coHostName),
          programImagePath: row.programImagePath == null ? null : String(row.programImagePath),
          isActive: row.isActive == null ? true : Boolean(row.isActive),
          jockId: String(row.jockId),
        },
      });
    }

    for (const row of homeHeroHeadlineSlots) {
      await tx.homeHeroHeadlineSlot.create({
        data: {
          id: String(row.id),
          startsOn: coerceDate(row.startsOn),
          endsOn: coerceDate(row.endsOn),
          weekdays: row.weekdays == null ? null : String(row.weekdays),
          startTime: row.startTime == null ? null : String(row.startTime),
          endTime: row.endTime == null ? null : String(row.endTime),
          titleLine1: String(row.titleLine1),
          titleLine2: row.titleLine2 == null ? null : String(row.titleLine2),
          titleLine1Color: row.titleLine1Color == null ? "white" : String(row.titleLine1Color),
          titleLine2Color: row.titleLine2Color == null ? "teal" : String(row.titleLine2Color),
          priority: row.priority == null ? 0 : Number(row.priority),
          isActive: row.isActive == null ? true : Boolean(row.isActive),
          note: row.note == null ? null : String(row.note),
        },
      });
    }

    for (const row of joinKissVacancies) {
      await tx.joinKissVacancy.create({
        data: {
          id: String(row.id),
          slot: String(row.slot),
          title: String(row.title),
          category: row.category == null ? "" : String(row.category),
          location: row.location == null ? "" : String(row.location),
          jobType: row.jobType == null ? "" : String(row.jobType),
          description: row.description == null ? "" : String(row.description),
          requirements: row.requirements == null ? "" : String(row.requirements),
          applyLabel: row.applyLabel == null ? "Solliciteer" : String(row.applyLabel),
          applyUrl: row.applyUrl == null ? "mailto:info@kissfm.nl" : String(row.applyUrl),
          imagePath: row.imagePath == null ? null : String(row.imagePath),
          isActive: row.isActive == null ? true : Boolean(row.isActive),
          sortOrder: row.sortOrder == null ? 0 : Number(row.sortOrder),
        },
      });
    }

    for (const row of joinKissBenefits) {
      await tx.joinKissBenefit.create({
        data: {
          id: String(row.id),
          sortOrder: row.sortOrder == null ? 0 : Number(row.sortOrder),
          title: String(row.title),
          body: row.body == null ? "" : String(row.body),
          isActive: row.isActive == null ? true : Boolean(row.isActive),
        },
      });
    }

    for (const row of kiss40Weeks) {
      await tx.kiss40Week.create({
        data: {
          id: String(row.id),
          weekStart: coerceDate(row.weekStart),
          title: row.title == null ? "" : String(row.title),
          status: row.status == null ? "draft" : String(row.status),
          tracksJson: row.tracksJson == null ? "[]" : String(row.tracksJson),
          notes: row.notes == null ? "" : String(row.notes),
        },
      });
    }

    for (const row of concerts) {
      await tx.concert.create({
        data: {
          id: String(row.id),
          title: String(row.title),
          venue: row.venue == null ? null : String(row.venue),
          city: row.city == null ? null : String(row.city),
          date: coerceDate(row.date),
          url: row.url == null ? null : String(row.url),
          imagePath: row.imagePath == null ? null : String(row.imagePath),
          source: row.source == null ? null : String(row.source),
          externalKey: row.externalKey == null ? null : String(row.externalKey),
          isActive: row.isActive == null ? true : Boolean(row.isActive),
        },
      });
    }

    for (const row of concertSyncBlocks) {
      await tx.concertSyncBlock.create({
        data: {
          externalKey: String(row.externalKey),
          source: row.source == null ? "ticketmaster" : String(row.source),
          reason: row.reason == null ? null : String(row.reason),
        },
      });
    }

    for (const row of studioBookings) {
      await tx.studioBooking.create({
        data: {
          id: String(row.id),
          startAt: coerceDate(row.startAt),
          endAt: coerceDate(row.endAt),
          title: String(row.title),
          purpose: row.purpose == null ? "CUSTOM" : String(row.purpose),
          notes: row.notes == null ? null : String(row.notes),
          bookedByName: String(row.bookedByName),
          bookedByUserId: null,
          recurrenceGroupId: row.recurrenceGroupId == null ? null : String(row.recurrenceGroupId),
          isCancelled: row.isCancelled == null ? false : Boolean(row.isCancelled),
        },
      });
    }
  });
  } catch (e) {
    console.error("[importSiteBackup]", e);
    return {
      success: false as const,
      error: "Import mislukt. Controleer of het bestand bij deze site hoort en of de database leeg genoeg is (geen foreign key conflicten).",
    };
  }

  const paths = [
    "/",
    "/programmering",
    "/djs",
    "/settings",
    "/settings/site",
    "/settings/programmering",
    "/settings/website-teksten",
    "/settings/concerten",
    "/settings/join-kiss",
    "/admin/djs",
    "/admin/programmering",
  ];
  for (const p of paths) {
    revalidatePath(p);
  }
  revalidatePath("/djs", "layout");

  return { success: true as const };
}
