import { authOptions } from "@/lib/auth";
import { isPortalAdmin } from "@/lib/authRoles";
import { publicMediaUrlFromStoragePath } from "@/lib/mediaPublicUrl";
import { prisma } from "@/lib/prisma";
import { MediaLibrary } from "./MediaLibrary";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mediabibliotheek — GLXY",
};

export default async function AdminMediaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let rows: Awaited<ReturnType<typeof prisma.mediaAsset.findMany>> = [];
  let listError: string | null = null;
  try {
    rows = await prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch (e) {
    rows = [];
    console.error("[AdminMediaPage] mediaAsset.findMany", e);
    listError =
      "De mediabibliotheek kan niet worden geladen. Controleer DATABASE_URL en voer op de server `npx prisma db push` uit (model MediaAsset).";
  }

  const initial = rows.map((r) => ({
    id: r.id,
    filename: r.filename,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    createdAt: r.createdAt.toISOString(),
    publicUrl: publicMediaUrlFromStoragePath(r.storagePath),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-2">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-main)]">Mediabibliotheek</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Upload afbeeldingen voor o.a. logo en favicon. Gebruik “→ Logo” / “→ Favicon” om direct de publieke site bij te werken, of kopieer de URL naar Huisstijl.
        </p>
      </header>
      <MediaLibrary initial={initial} listError={listError} />
    </div>
  );
}
