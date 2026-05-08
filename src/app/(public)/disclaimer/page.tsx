import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";

export const dynamic = "force-dynamic";

const DEFAULT_TITLE = "Wettelijke vermeldingen";

const DEFAULT_CONTENT = `WETTELIJKE VERMELDINGEN - KISS FM

UITGEVER
Deze website is het officiële online platform van KISS FM, een onafhankelijk radiostation geregistreerd in de Benelux.

KISS FM is een merknaam van Easy Radio B.V.

Handelsnaam: KISS FM
Merkregistratie: Gedeponeerd bij het Benelux-Bureau voor de Intellectuele Eigendom (BOIP)
Depotnummer: 1509603
Rechtspersoon: Easy Radio B.V.
KvK-nummer: 87226103
Vestigingsadres: P.J Oudweg 4, 1314 CH, Almere.
E-mail: legal@kissfm.nl
Gebruik van deze website houdt in dat u akkoord gaat met deze wettelijke bepalingen en voorwaarden.

HOSTINGINFORMATIE
De hosting van deze website wordt verzorgd door:

Hostnet B.V.
De Ruijterkade 6
1013 AA Amsterdam
KvK-nummer: 34130993
Telefoon: 020-7500800
E-mail: sales@hostnet.nl
Website: www.hostnet.nl

INTELLECTUELE EIGENDOM & MERKENRECHTEN
Alle inhoud op deze website (teksten, logo's, beeldmateriaal, audiofragmenten, software, etc.) is beschermd door auteursrechten en andere intellectuele eigendomsrechten. Tenzij uitdrukkelijk anders vermeld, behoren deze rechten toe aan Easy Radio B.V. of haar licentiegevers.

De merknaam "KISS FM" is een geregistreerd merk en eigendom van Easy Radio B.V. Het merk is officieel geregistreerd bij het Benelux-Bureau voor de Intellectuele Eigendom (BOIP) onder depotnummer 1509603. Elk ongeoorloofd gebruik of reproductie is verboden en zal juridisch worden bestreden.

AUDIOVORMGEVING
KISS FM maakt gebruik van audiovormgeving geproduceerd door ReelWorld Productions Inc. Het gebruik hiervan is geregeld via een licentieovereenkomst met ReelWorld Productions Inc.

ReelWorld Productions Inc.
2214 Queen Anne Avenue N.
Seattle, WA 98109
Verenigde Staten
Telefoon: +1 (206) 448-1518
Website: www.reelworld.com

MERKEN VAN DERDEN
Merken en logo's van derden op deze site zijn eigendom van de respectieve rechthebbenden. Gebruik daarvan zonder toestemming is niet toegestaan.

GEBRUIKSVOORWAARDEN
Deze website mag uitsluitend worden gebruikt voor persoonlijke, niet-commerciele doeleinden. Het is niet toegestaan om zonder schriftelijke toestemming van Easy Radio B.V. content te kopieren, verspreiden of wijzigen.

Easy Radio B.V. is niet aansprakelijk voor schade als gevolg van het gebruik van deze website of de inhoud ervan.

DISCLAIMER
De inhoud van deze website wordt met zorg samengesteld. Toch kan het voorkomen dat informatie verouderd of onjuist is. Easy Radio B.V. aanvaardt geen aansprakelijkheid voor eventuele fouten of onvolledigheden.

De site kan links bevatten naar externe websites. Easy Radio B.V. is niet verantwoordelijk voor de inhoud of werking van deze sites van derden.

HYPERLINKS
Het is toegestaan om te linken naar onze homepage, mits:

De site opent in een nieuw venster
Er geen gebruik wordt gemaakt van framing
De link niet voorkomt op websites met onwettige of ongepaste inhoud

PERSOONSGEGEVENS
Deze website verwerkt persoonsgegevens in overeenstemming met de AVG (Algemene Verordening Gegevensbescherming). Wij verzamelen alleen gegevens die nodig zijn voor:

Analyse van websitebezoek (statistieken)
Optimalisatie van gebruikerservaring
Communicatie (zoals contactformulieren)
Uw rechten: U heeft recht op inzage, correctie, verwijdering, overdraagbaarheid en bezwaar.
Voor verzoeken kunt u contact opnemen via: legal@kissfm.nl

COOKIEBELEID
Bij KISS FM hechten we waarde aan uw privacy. Daarom informeren wij u graag transparant over het gebruik van cookies op deze website.

Wat zijn cookies?

Cookies zijn kleine tekstbestanden die op uw apparaat worden geplaatst wanneer u onze website bezoekt. Ze zorgen ervoor dat de website goed functioneert en kunnen gebruikersvoorkeuren onthouden.

Welke cookies gebruiken wij? Deze website maakt alleen gebruik van functionele cookies die noodzakelijk zijn voor het functioneren van de site. We gebruiken geen tracking-, analytische- of advertentiecookies van derden.

Cookie-instellingen beheren

Omdat wij geen cookies gebruiken die toestemming vereisen, is er geen cookiebanner nodig. U kunt via uw browserinstellingen cookies blokkeren of verwijderen. Houd er rekening mee dat bepaalde functies dan mogelijk niet goed werken.

Wijzigingen

Wij behouden ons het recht voor dit beleid aan te passen. Controleer deze pagina regelmatig voor updates.

Contact bij vragen over cookies: legal@kissfm.nl

KLACHTEN EN MELDINGEN
Klachten over de inhoud of werking van deze website kunnen schriftelijk of per e-mail worden ingediend bij:

Easy Radio B.V.
P.J Oudweg 4, 1314 CH, Almere.
E-mail: legal@kissfm.nl

Wij streven ernaar binnen 14 werkdagen een inhoudelijke reactie te geven.`;

export default async function DisclaimerPage() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ["LEGAL_PAGE_TITLE", "LEGAL_PAGE_CONTENT"] } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const title = map.get("LEGAL_PAGE_TITLE") || DEFAULT_TITLE;
  const content = map.get("LEGAL_PAGE_CONTENT") || DEFAULT_CONTENT;
  return (
    <div className={PUBLIC_PAGE_SHELL}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--brand-navy)" }}>
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
