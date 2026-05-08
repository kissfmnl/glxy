import Link from "next/link";
import { MOCK_ACTIONS } from "@/lib/mock/site";
import { KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";
import AppImage from "@/components/AppImage";

export async function ActionsPanel() {
  const primary = MOCK_ACTIONS[0]!;
  const actionImage = primary.imagePath;

  return (
    <div className="kiss-public-panel galaxy-actions-panel overflow-hidden rounded-3xl border border-white/12 bg-[#0c1224]/85 text-gray-100 shadow-[0_0_32px_rgba(167,139,250,0.08)] backdrop-blur-sm">
      <div className={KISS_PANEL_HEADER_BOX}>
        <p className={KISS_PANEL_TITLE}>Acties</p>
      </div>
      <div className={`space-y-3 px-5 pb-5 pt-0 ${KISS_PANEL_HEADER_GAP}`}>
        <div className="rounded-2xl border border-white/12 bg-white/6 p-4">
          {actionImage ? (
            <div className="mb-3 overflow-hidden rounded-xl border border-white/15 bg-black/20">
              <AppImage src={actionImage} alt="" className="h-32 w-full object-cover" />
            </div>
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/85">Nu live · demo</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <h3 className="text-lg font-black text-white">{primary.title}</h3>
            <Link href="/acties" className="text-[10px] font-black uppercase tracking-[0.16em] text-white/65 hover:text-cyan-200">
              Alle acties →
            </Link>
          </div>
          <p className="mt-1 text-sm font-bold text-white/80">{primary.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={primary.href || "#"} className="inline-flex rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-[#070a14]">
              Bekijk actie
            </Link>
            <Link href="/acties" className="inline-flex rounded-xl border border-white/25 px-3 py-2 text-xs font-black text-white">
              Overzicht
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
