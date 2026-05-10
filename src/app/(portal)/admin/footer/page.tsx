import { authOptions } from "@/lib/auth";
import { isPortalAdmin } from "@/lib/authRoles";
import { mergeFooterConfig } from "@/lib/footerConfig";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FooterAdminForm } from "./FooterAdminForm";

export const metadata = {
  title: "Footer — GLXY",
};

export default async function AdminFooterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let merged = mergeFooterConfig(null);
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { footerConfig: true } });
    merged = mergeFooterConfig(row?.footerConfig ?? null);
  } catch {
    /* database niet beschikbaar */
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-[var(--text-main)]">Footer</h1>
        <p className="text-sm text-[var(--text-muted)]">
          De gele balk onderaan de publieke site: logo links, social icons rechts. Hoofdlogo staat onder{" "}
          <Link href="/admin/branding" className="font-semibold text-[var(--brand-yellow)] underline-offset-2 hover:underline">
            Huisstijl
          </Link>
          .
        </p>
      </header>
      <FooterAdminForm defaults={merged} />
    </div>
  );
}
