import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import { MOCK_SOCIAL } from "@/lib/mock/site";

const socialBtn =
  "inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#1e375a]/20 bg-white text-[#1e375a] shadow-sm transition-colors hover:bg-[#eef5fb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#37bfbf]";

function IconInstagram() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64v-3.5a6.33 6.33 0 00-1-.05 6.34 6.34 0 00-5.46 9.48A6.34 6.34 0 0018.15 15.8V8.87a8.16 8.16 0 004.41-2.18l-2.97-.01z" />
    </svg>
  );
}

export default function ContactPage() {
  const subtitle = "Contact & samenwerkingen — fictieve gegevens voor deze demo-build.";
  const email = "hello@glxy.radio";
  const address = "Orion Beltway 42, 0001 XX — demo";
  const hours = "Altijd online (stream)";

  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          Contact
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">{subtitle}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[#cfdeeb] bg-gradient-to-b from-[#f8fbff] to-[#f1f7fc] p-6">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Contact</div>
          <div className="mt-3 space-y-2 text-sm font-bold text-gray-700">
            <p>
              E-mail:{" "}
              <a href={`mailto:${email}`} className="font-black text-[#1e375a] hover:underline">
                {email}
              </a>
            </p>
            <p>
              Adres: <span className="font-black text-gray-900">{address}</span>
            </p>
            <p>
              Bereikbaar: <span className="font-black text-gray-900">{hours}</span>
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-[#cfdeeb] bg-gradient-to-b from-[#f8fbff] to-[#f1f7fc] p-6">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Socials</div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href={MOCK_SOCIAL.instagramUrl} target="_blank" rel="noreferrer" className={socialBtn} aria-label="Instagram">
              <IconInstagram />
            </a>
            <a href={MOCK_SOCIAL.tiktokUrl} target="_blank" rel="noreferrer" className={socialBtn} aria-label="TikTok">
              <IconTikTok />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
