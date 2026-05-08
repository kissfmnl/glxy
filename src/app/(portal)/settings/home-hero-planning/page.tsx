import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { HomeHeroScheduleClient, type HeroSlotRow } from "./HomeHeroScheduleClient";
import { hasPortalPermission } from "@/lib/portalPermissions";

export const dynamic = "force-dynamic";

function serializeSlot(s: {
  id: string;
  startsOn: Date;
  endsOn: Date;
  weekdays: string | null;
  startTime: string | null;
  endTime: string | null;
  titleLine1: string;
  titleLine2: string | null;
  titleLine1Color: string;
  titleLine2Color: string;
  priority: number;
  isActive: boolean;
  note: string | null;
}): HeroSlotRow {
  return {
    id: s.id,
    startsOn: s.startsOn.toISOString().slice(0, 10),
    endsOn: s.endsOn.toISOString().slice(0, 10),
    weekdays: s.weekdays,
    startTime: s.startTime,
    endTime: s.endTime,
    titleLine1: s.titleLine1,
    titleLine2: s.titleLine2,
    titleLine1Color: s.titleLine1Color,
    titleLine2Color: s.titleLine2Color,
    priority: s.priority,
    isActive: s.isActive,
    note: s.note,
  };
}

export default async function HomeHeroPlanningSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  let rows: HeroSlotRow[] = [];
  try {
    const slots = await prisma.homeHeroHeadlineSlot.findMany({
      orderBy: [{ startsOn: "desc" }, { priority: "desc" }],
    });
    rows = slots.map(serializeSlot);
  } catch {
    rows = [];
  }

  return (
    <PortalPageShell width="wide">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary hover:underline"
      >
        ← Terug naar site instellingen
      </Link>
      <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Geplande titels (home)</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
        Tijdelijke of terugkerende koppen op de startpagina: kies een periode en optioneel alleen bepaalde weekdagen (bijv. ma–vr).
        Handig voor feestdagen én vaste weekteksten. Zonder passende planning: vaste titels uit website-teksten.
      </p>
      <HomeHeroScheduleClient initialSlots={rows} />
    </PortalPageShell>
  );
}
