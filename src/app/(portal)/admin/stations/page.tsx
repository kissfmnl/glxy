import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stationsForAdminFormDefaults } from "@/lib/glxyStations";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { StationsAdminForm } from "./StationsAdminForm";

const FALLBACK_COLORS: Record<string, string> = {
  z1: "#e11d48",
  z2: "#84cc16",
  z3: "#facc15",
  z4: "#7dd3fc",
};

export const metadata = {
  title: "Zenders & streams — GLXY",
};

export default async function AdminStationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  let defaults = {
    ...stationsForAdminFormDefaults(null),
    stationColors: { ...FALLBACK_COLORS },
  };

  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 } });
    if (row) {
      const sf = stationsForAdminFormDefaults(row.stationsConfig ?? null);
      defaults = {
        ...sf,
        stationColors:
          row.stationColors && typeof row.stationColors === "object" && !Array.isArray(row.stationColors)
            ? { ...FALLBACK_COLORS, ...(row.stationColors as Record<string, string>) }
            : { ...FALLBACK_COLORS },
      };
    }
  } catch {
    /* db off */
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-main)]">Zenders & streams</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Beheer wat op de homepage onder de live-video staat: streams, logo’s, nu-speelt-tekstbestanden en kaartkleuren.{" "}
          <a href="/admin/player-ui" className="font-semibold text-[var(--brand-yellow)] underline-offset-2 hover:underline">
            Player & weergave
          </a>{" "}
          voor kleuren van knoppen en de vaste mini-player.
        </p>
      </header>
      <StationsAdminForm defaults={defaults} />
    </div>
  );
}
