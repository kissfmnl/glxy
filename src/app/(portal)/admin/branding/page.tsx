import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandingForm } from "./BrandingForm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const FALLBACK = {
  primaryHex: "#0b7557",
  accentHex: "#6d6d6d",
  navyHex: "#363636",
  yellowHex: "#ffe200",
  logoUrl: "",
  faviconUrl: "",
  homeHlsUrl: "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8",
};

export const metadata = {
  title: "Huisstijl — GLXY",
};

export default async function AdminBrandingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  let defaults = { ...FALLBACK };
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 } });
    if (row) {
      defaults = {
        primaryHex: row.primaryHex,
        accentHex: row.accentHex,
        navyHex: row.navyHex,
        yellowHex: row.yellowHex ?? FALLBACK.yellowHex,
        logoUrl: row.logoUrl ?? "",
        faviconUrl: row.faviconUrl ?? "",
        homeHlsUrl: row.homeHlsUrl || FALLBACK.homeHlsUrl,
      };
    }
  } catch {
    /* database niet beschikbaar */
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-main)]">Huisstijl & livestream</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Publieke GLXY-site: kleuren via CSS-variabelen, optioneel logo in de header, favicon, en de HLS-embed op de homepage.
        </p>
      </header>
      <BrandingForm defaults={defaults} />
    </div>
  );
}
