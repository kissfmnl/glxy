import type { PublicJustPlayedConfig } from "@/lib/justPlayedConfig";

export function GlxyHomePanelHeading({ title, theme }: { title: string; theme: PublicJustPlayedConfig }) {
  return (
    <div className="shrink-0 px-4 pb-2.5 pt-3">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.38em]"
        style={{ color: theme.sectionTitleHex }}
      >
        {title}
      </p>
      <div
        className="mt-2.5 h-px w-16 max-w-[40%] rounded-full opacity-95"
        style={{
          background: `linear-gradient(90deg, ${theme.sectionAccentHex}, transparent)`,
        }}
      />
    </div>
  );
}
