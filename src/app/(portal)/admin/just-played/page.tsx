import { authOptions } from "@/lib/auth";
import { isPortalAdmin } from "@/lib/authRoles";
import { mergeJustPlayedConfig } from "@/lib/justPlayedConfig";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { JustPlayedAdminForm } from "./JustPlayedAdminForm";

export const metadata = {
  title: "Just played — GLXY",
};

export default async function AdminJustPlayedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let merged = mergeJustPlayedConfig(null);
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { justPlayedConfig: true } });
    merged = mergeJustPlayedConfig(row?.justPlayedConfig ?? null);
  } catch {
    /* database niet beschikbaar */
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-[var(--text-main)]">Just played</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Kleuren van het titelblok op de homepage. Trackgeschiedenis en hoesjes komen uit nu-speelt endpoints (JSON of tekst).
        </p>
      </header>
      <JustPlayedAdminForm defaults={merged} />
    </div>
  );
}
