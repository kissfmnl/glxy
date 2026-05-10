"use client";

import { CookieNotice } from "@/components/public/CookieNotice";
import { GlxyRadioProvider } from "@/components/public/GlxyRadioProvider";
import { PublicMain } from "@/components/public/PublicMain";
import { PublicMiniPlayer } from "@/components/public/PublicMiniPlayer";

export function PublicRadioShell({
  children,
  enabled,
  text,
  cta,
}: {
  children: React.ReactNode;
  enabled: boolean;
  text: string;
  cta: string;
}) {
  return (
    <GlxyRadioProvider>
      <PublicMain>{children}</PublicMain>
      <CookieNotice enabled={enabled} text={text} cta={cta} />
      <PublicMiniPlayer />
    </GlxyRadioProvider>
  );
}
