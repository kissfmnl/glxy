import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";
import AppImage from "@/components/AppImage";

function websiteAssetUrl(rel: string | null | undefined) {
  const value = String(rel || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return "/api/assets/" + value.split("/").map(encodeURIComponent).join("/");
}

export async function ActionsPanel() {
  const actions = await prisma.publicAction.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 3,
  });
  const fallbackImageRow = await prisma.siteSetting.findUnique({
    where: { key: "ACTION_THROWBACK_IMAGE_PATH" },
    select: { value: true },
  });
  const primary = actions[0] ?? null;
  const actionImage = websiteAssetUrl(primary?.imagePath) || websiteAssetUrl(fallbackImageRow?.value);
  return (
    <div className="kiss-public-panel rounded-3xl border border-[#1e375a]/12 bg-white/95 text-[#1e375a] shadow-sm overflow-hidden">
      <div className={KISS_PANEL_HEADER_BOX}>
        <p className={KISS_PANEL_TITLE}>Acties</p>
      </div>
      <div className={`px-5 pb-5 pt-0 ${KISS_PANEL_HEADER_GAP} space-y-3`}>
        <div className="rounded-2xl border border-[#d3e2f1] bg-[#f4f9ff] p-4">
          {actionImage ? (
            <div className="mb-3 overflow-hidden rounded-xl border border-[#c8dcef] bg-white">
              <AppImage src={actionImage} alt="" className="h-32 w-full object-cover" />
            </div>
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#365579]">Nu live</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <h3 className="text-lg font-black text-[#1e375a]">{primary?.title ?? "KISS Throwback Party"}</h3>
            <Link href="/acties" className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1e375a]/70 hover:text-[#1e375a]">
              Alle acties bekijken →
            </Link>
          </div>
          <p className="mt-1 text-sm font-bold text-[#365579]">
            {primary?.body ?? "Doe mee met je bedrijfsteam: kies 6-10 tracks, upload je teamfoto en maak kans op een prijs."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={primary?.href ?? "/throwback"} className="inline-flex rounded-xl bg-[#1e375a] px-3 py-2 text-xs font-black text-white">
              {primary?.ctaLabel ?? "Meteen meedoen"}
            </Link>
            <Link href="/acties" className="inline-flex rounded-xl border border-[#1e375a]/25 px-3 py-2 text-xs font-black text-[#1e375a]">
              Alle acties
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
