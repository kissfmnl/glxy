import type { ReactNode } from "react";

const widths = {
  /** Standaard instellingen / meeste formulieren */
  default: "max-w-6xl",
  /** Dashboard, DJ’s, programmering, concerten */
  wide: "max-w-[1600px]",
  /** Smalle formulieren (radio-delay, developer) */
  narrow: "max-w-2xl",
  /** Join KISS, geplande hero-titels, collage, badges */
  readable: "max-w-4xl",
} as const;

export type PortalPageWidth = keyof typeof widths;

/**
 * Eén shell voor het portaal: zelfde max-breedte en verticale ritme.
 * Horizontale padding komt van `app/(portal)/layout.tsx` (main).
 */
export function PortalPageShell({
  children,
  width = "default",
  className = "",
}: {
  children: ReactNode;
  width?: PortalPageWidth;
  className?: string;
}) {
  return <div className={`mx-auto w-full ${widths[width]} pb-16 pt-2 ${className}`.trim()}>{children}</div>;
}
