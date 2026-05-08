/** Text wordmark for static GLXY Radio demo (no image assets). */
export function GlxyWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex select-none items-baseline gap-1.5 font-black tracking-[-0.02em] ${className}`}
      aria-label="GLXY Radio"
    >
      <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(56,189,248,0.45)]">
        GLXY
      </span>
      <span className="text-white/90">Radio</span>
    </span>
  );
}
