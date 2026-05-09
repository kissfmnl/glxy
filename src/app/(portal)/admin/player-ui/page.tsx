import { authOptions } from "@/lib/auth";
import { mergePlayerUi } from "@/lib/playerUi";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PlayerUiForm } from "./PlayerUiForm";

export const metadata = {
  title: "Player & weergave — GLXY",
};

export default async function AdminPlayerUiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  let defaults = mergePlayerUi(null);
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 } });
    if (row?.playerUi) defaults = mergePlayerUi(row.playerUi);
  } catch {
    /* db weg */
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-main)]">Player & weergave</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Kleuren voor de zenderkaarten op de homepage, de vaste mini-player onderaan, en de bediening van de live-video. Staat los van{" "}
          <a href="/admin/branding" className="font-semibold text-[var(--brand-yellow)] underline-offset-2 hover:underline">
            Huisstijl
          </a>
          .
        </p>
      </header>
      <PlayerUiForm defaults={defaults} />
    </div>
  );
}
