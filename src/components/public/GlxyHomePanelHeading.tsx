import type { PublicJustPlayedConfig } from "@/lib/justPlayedConfig";

/** Strakke sectiekop — één geheel met het paneel, navy + dun GLXY-accent (geen glow/wash). */
export function GlxyHomePanelHeading({ title, theme }: { title: string; theme: PublicJustPlayedConfig }) {
  return (
    <header
      className="shrink-0 border-b px-4 pb-3 pt-3.5 sm:px-4 sm:pb-3 sm:pt-4"
      style={{
        borderColor: theme.panelBorderHex,
        background: `linear-gradient(180deg, #0a101c 0%, ${theme.panelSurfaceHex} 100%)`,
      }}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.28em] sm:text-[11px] sm:tracking-[0.32em]"
            style={{ color: theme.sectionTitleHex }}
          >
            {title}
          </p>
          <div
            className="mt-2 h-0.5 w-12 rounded-full sm:w-14"
            style={{ backgroundColor: theme.sectionAccentHex }}
            aria-hidden
          />
        </div>
      </div>
    </header>
  );
}
