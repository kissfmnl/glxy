import AppImage from "@/components/AppImage";
const R = "1.5rem";

export function FrequentiesCoverageMap({ src }: { src: string }) {
  return (
    <div className="relative w-full min-w-0 lg:h-full lg:min-h-0">
      <div className="w-full overflow-hidden lg:absolute lg:inset-0 lg:min-h-0" style={{ borderRadius: R }}>
        <AppImage
          src={src}
          alt="KISS FM frequentiegebied"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="block h-auto w-full object-contain object-bottom min-h-[12rem] sm:min-h-[14rem] lg:h-full lg:min-h-0"
          style={{ borderRadius: R }}
        />
      </div>
    </div>
  );
}
