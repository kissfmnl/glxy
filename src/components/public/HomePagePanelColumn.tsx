import { NowNextCard } from "@/components/public/NowNextCard";
import { CurrentShowPanel } from "@/components/public/CurrentShowPanel";
import { RecentTracksPanel } from "@/components/public/RecentTracksPanel";
import { ConcertsPanel } from "@/components/public/ConcertsPanel";

/** Shared homepage panel stack (content unchanged across layout variants). */
export function HomePagePanelColumn() {
  return (
    <div className="w-full max-w-[min(560px,100%)] mx-auto lg:mx-0 space-y-4">
      <NowNextCard withPlayer />
      <div className="relative z-30 w-full min-w-0">
        <CurrentShowPanel />
      </div>
      <div className="relative z-20 w-full min-w-0">
        <RecentTracksPanel limit={5} stations={[]} />
      </div>
      <div className="relative z-20 w-full min-w-0">
        <ConcertsPanel />
      </div>
    </div>
  );
}
