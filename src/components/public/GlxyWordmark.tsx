/** Text wordmark for static GLXY Radio demo (no image assets). */
export function GlxyWordmark({
  className = "",
  variant = "default",
}: {
  className?: string;
  /** Donkere variant voor lichte achtergronden (o.a. gele footer). */
  variant?: "default" | "onLight";
}) {
  const glxy =
    variant === "onLight" ? (
      <span className="bg-gradient-to-r from-[#0b7557] via-[#0e7490] to-[#0b7557] bg-clip-text text-transparent">
        GLXY
      </span>
    ) : (
      <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(56,189,248,0.45)]">
        GLXY
      </span>
    );
  const radio = variant === "onLight" ? "text-gray-900" : "text-white/90";
  return (
    <span
      className={`inline-flex select-none items-baseline gap-1.5 font-black tracking-[-0.02em] ${className}`}
      aria-label="GLXY Radio"
    >
      {glxy}
      <span className={radio}>Radio</span>
    </span>
  );
}
