import { PUBLIC_PAGE_INTRO } from "@/lib/publicPageLayout";
import { ThrowbackSongPicker } from "@/components/public/ThrowbackSongPicker";
import { MOCK_THROWBACK_SONGS } from "@/lib/mock/site";

export default function ThrowbackActionPage() {
  const kicker = "Actie · demo";
  const title = "GLXY Throwback Mix";
  const subtitle = "Stap 1 van 2: stel je teamplaylist samen (statische voorbeeldtracks).";

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl px-3.5 py-8 sm:px-4 md:px-6">
      <div className={PUBLIC_PAGE_INTRO}>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#365579]">{kicker}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e375a] md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm font-medium text-gray-600">{subtitle}</p>
      </div>
      <div className="mt-8">
        <ThrowbackSongPicker songs={MOCK_THROWBACK_SONGS} />
      </div>
    </div>
  );
}
