import { prisma } from "@/lib/prisma";

export type SiteBackupPayloadV1 = {
  version: 1;
  exportedAt: string;
  jocks: unknown[];
  siteSettings: unknown[];
  scheduleSlots: unknown[];
  scheduleTemporarySlots: unknown[];
  homeHeroHeadlineSlots: unknown[];
  joinKissVacancies: unknown[];
  joinKissBenefits: unknown[];
  kiss40Weeks: unknown[];
  concerts: unknown[];
  concertSyncBlocks: unknown[];
  studioBookings: unknown[];
};

export async function buildSiteBackupExport(): Promise<SiteBackupPayloadV1> {
  const [
    jocks,
    siteSettings,
    scheduleSlots,
    scheduleTemporarySlots,
    homeHeroHeadlineSlots,
    joinKissVacancies,
    joinKissBenefits,
    kiss40Weeks,
    concerts,
    concertSyncBlocks,
    studioBookings,
  ] = await Promise.all([
    prisma.jock.findMany(),
    prisma.siteSetting.findMany(),
    prisma.scheduleSlot.findMany(),
    prisma.scheduleTemporarySlot.findMany(),
    prisma.homeHeroHeadlineSlot.findMany(),
    prisma.joinKissVacancy.findMany(),
    prisma.joinKissBenefit.findMany(),
    prisma.kiss40Week.findMany(),
    prisma.concert.findMany(),
    prisma.concertSyncBlock.findMany(),
    prisma.studioBooking.findMany(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    jocks,
    siteSettings,
    scheduleSlots,
    scheduleTemporarySlots,
    homeHeroHeadlineSlots,
    joinKissVacancies,
    joinKissBenefits,
    kiss40Weeks,
    concerts,
    concertSyncBlocks,
    studioBookings,
  };
}
