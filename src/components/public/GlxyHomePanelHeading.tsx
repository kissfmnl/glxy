import type { PublicJustPlayedConfig } from "@/lib/justPlayedConfig";

export function GlxyHomePanelHeading({ title, theme }: { title: string; theme: PublicJustPlayedConfig }) {
  return (
    <div className="relative shrink-0 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-90"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${theme.sectionAccentHex} 22%, transparent) 0%, transparent 100%)`,
        }}
        aria-hidden
      />
      <p
        className="relative text-[11px] font-bold uppercase tracking-[0.42em] sm:text-xs"
        style={{
          color: theme.sectionTitleHex,
          textShadow: `0 0 28px color-mix(in srgb, ${theme.sectionAccentHex} 35%, transparent)`,
        }}
      >
        {title}
      </p>
      <div className="relative mt-3 flex items-center gap-3">
        <div
          className="h-[3px] w-20 max-w-[45%] rounded-full sm:w-28"
          style={{
            background: `linear-gradient(90deg, ${theme.sectionAccentHex}, transparent)`,
            boxShadow: `0 0 20px color-mix(in srgb, ${theme.sectionAccentHex} 60%, transparent)`,
          }}
        />
        <div className="h-px flex-1 bg-gradient-to-r from-white/12 to-transparent" />
      </div>
    </div>
  );
}
