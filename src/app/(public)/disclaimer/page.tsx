import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";

const title = "Wettelijke vermelding (demo)";
const content = `GLXY RADIO — DEMO-SITE

Dit is een statische frontend-demo. Er is geen reële omroepverbinding en geen commerciële dienstverlening gekoppeld aan deze build.

CONTENT & AANSPRAKELIJKHEID
Alle teksten, afbeeldingen en merkverwijzingen zijn bedoeld als voorbeeld. Gebruik voor productie eigen juridische review.

INTELLECTUELE EIGENDOM
Voor onderdelen van derden (bijv. Unsplash-afbeeldingen of Spotify-embeds) gelden de licenties van die diensten.

CONTACT (FICTIEF)
hello@glxy.radio

Hosting, cookiebeleid en volledige productie-legalese volgen bij een echte launch.`;

export default function DisclaimerPage() {
  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          {title}
        </h1>
      </div>
      <div className="mt-8 rounded-3xl border border-[#d3dae4] bg-gradient-to-b from-[#f5f9fc] to-[#edf3f8] p-5 md:p-7">
        <article className="whitespace-pre-line rounded-2xl border border-[#d7e1ec] bg-white p-4 text-sm font-semibold leading-relaxed text-[#1e375a] md:p-5">
          {content}
        </article>
      </div>
    </div>
  );
}
