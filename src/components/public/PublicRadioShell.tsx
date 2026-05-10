"use client";

import { CookieNotice } from "@/components/public/CookieNotice";
import { GlxyRadioProvider } from "@/components/public/GlxyRadioProvider";
import { PublicMain } from "@/components/public/PublicMain";
import { PublicMiniPlayer } from "@/components/public/PublicMiniPlayer";
import type { GlxyStation } from "@/lib/glxyStations";

export function PublicRadioShell({
  children,
  enabled,
  text,
  cta,
  initialStations,
}: {
  children: React.ReactNode;
  enabled: boolean;
  text: string;
  cta: string;
  initialStations?: GlxyStation[];
}) {
  return (
    <GlxyRadioProvider initialStations={initialStations}>
      <PublicMain>{children}</PublicMain>
      <CookieNotice enabled={enabled} text={text} cta={cta} />
      <PublicMiniPlayer />
    </GlxyRadioProvider>
  );
}
