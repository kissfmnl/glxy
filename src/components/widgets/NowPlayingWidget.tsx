"use client";

import { NowNextCard } from "@/components/public/NowNextCard";

export default function NowPlayingWidget() {
  return (
    <div className="h-full overflow-visible">
      <div className="origin-top scale-100">
        <NowNextCard withPlayer disableCardHover />
      </div>
    </div>
  );
}
