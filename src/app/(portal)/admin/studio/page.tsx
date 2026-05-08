import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { hasPortalPermission } from "@/lib/portalPermissions";

const DEFAULT_STUDIO_BOOKING_URL = "https://calendar.online/cd0577e1ec69b88742e9";
const DEFAULT_STUDIO_BOOKING_NOTE =
  "Via deze agenda kunnen mensen de studio reserveren om op te nemen.";

export default async function AdminStudioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageStudioLegacy")) redirect("/settings");

  let bookingUrl = DEFAULT_STUDIO_BOOKING_URL;
  let bookingNote = DEFAULT_STUDIO_BOOKING_NOTE;
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["STUDIO_BOOKING_URL", "STUDIO_BOOKING_NOTE"] } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    bookingUrl = map.get("STUDIO_BOOKING_URL") || bookingUrl;
    bookingNote = map.get("STUDIO_BOOKING_NOTE") || bookingNote;
  } catch {}

  return (
    <PortalPageShell width="wide" className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Studio reservering</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{bookingNote}</p>
      </div>

      <div className="bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-premium">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Externe agenda</p>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-3 py-2 text-xs font-black text-brand-primary hover:bg-brand-primary/15 transition-colors"
          >
            Open in nieuw tabblad
          </a>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
          <iframe
            src={bookingUrl}
            title="Studio reserveringsagenda"
            className="w-full h-[78vh] min-h-[620px] bg-white"
            loading="lazy"
          />
        </div>
      </div>
    </PortalPageShell>
  );
}
