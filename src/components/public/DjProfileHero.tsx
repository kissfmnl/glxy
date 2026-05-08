"use client";

type Fact = { question: string; answer: string };

export function DjProfileHero({
  imageUrl,
  fallbackLogoUrl,
  name,
  focusX,
  focusY,
  bio,
  facts,
  fewFactsStretch,
}: {
  imageUrl: string | null;
  fallbackLogoUrl: string;
  name: string;
  focusX: number;
  focusY: number;
  bio: string;
  facts: Fact[];
  /** Foto-hoogte meegroeien met kolom (alleen bij weinig fun facts). */
  fewFactsStretch: boolean;
}) {
  const imgFill = fewFactsStretch ? "absolute inset-0 h-full w-full object-cover" : "h-full w-full object-cover";

  return (
    <div className={`flex flex-col gap-6 sm:flex-row ${fewFactsStretch ? "sm:items-stretch" : "sm:items-start"}`}>
      <div className={`w-full shrink-0 sm:w-[300px] md:w-[340px] ${fewFactsStretch ? "flex min-h-[200px] flex-col sm:min-h-0" : ""}`}>
        <div
          className={`relative overflow-hidden rounded-3xl border border-[#d1d9e5] bg-black/5 ${
            fewFactsStretch ? "min-h-[240px] flex-1 sm:min-h-[280px]" : "aspect-[3/4] w-full sm:max-h-[520px]"
          }`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className={imgFill}
              style={{ objectPosition: `${focusX}% ${focusY}%` }}
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="flex h-full min-h-[240px] w-full items-center justify-center p-6" style={{ backgroundColor: "#1e375a" }}>
              <img src={fallbackLogoUrl} alt="KISS FM" className="h-full w-full max-h-[320px] object-contain" />
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          {name}
        </h1>
        {bio.trim() ? (
          <p className="mt-3 text-sm font-bold leading-relaxed text-gray-700 whitespace-pre-wrap">{bio}</p>
        ) : null}
        {facts.length > 0 ? (
          <section className="mt-5 space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Fun facts</h2>
            <div className="space-y-3">
              {facts.map((f, i) => (
                <div key={i} className="rounded-2xl border border-[#d3dae4] bg-white p-4 shadow-sm">
                  <p className="font-black text-[#1f3f62]">{f.question || "Vraag"}</p>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-gray-700 whitespace-pre-wrap">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
