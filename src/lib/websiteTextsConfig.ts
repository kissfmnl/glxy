export const DEFAULT_FREQUENTIES_LINES = [
  "Amsterdam - 93.6 FM",
  "Haarlem - 97.3 FM",
  "Alkmaar - 96.3 FM",
  "Wieringermeer - 96.0 FM",
  "Almere - 97.4 FM",
  "Lelystad - 89.4 FM",
  "Emmeloord - 97.5 FM",
].join("\n");

/** Standaard actie-/giveawayvoorwaarden (één bullet per regel in de editor). */
export const DEFAULT_GIVEAWAY_TERMS_BULLETS = [
  "De spel- en actievoorwaarden van Kiss FM zijn van toepassing op iedere deelnemer en bindend voor iedere kandidaat die actief meedoet aan een actie.",
  "De spellen en acties en de bijbehorende prijzen vallen onder de volledige verantwoording van Kiss FM, onderdeel van Easy Radio B.V.",
  "Elk natuurlijk persoon, woonachtig in Nederland (met uitzondering van het Caribisch deel van het Koninkrijk der Nederlanden) en in het bezit van een geldig legitimatiebewijs is gerechtigd aan acties deel te nemen.",
  "We hanteren het deurbeleid van de desbetreffende evenementenlocatie wat betreft de leeftijdsgrens.",
  "Deelnemers aan prijsvragen en acties dienen desgevraagd in de Nederlandse taal hun naam, adres, woonplaats, telefoonnummer, e-mailadres en geboortedatum door te geven. Deelnemers die niet de juiste of volledig gevraagde gegevens opgeven, zijn van deelname uitgesloten. Bij het verstrekken van onjuiste gegevens behoudt Kiss FM zich het recht voor om prijzen niet uit te keren.",
  "Prijswinnaars worden geregistreerd in een database ter controle van de datum van deelname en de gewonnen prijzen.",
  "Gegevens van deelnemers zijn niet beschikbaar voor derden anders dan de direct bij het spel en/of de actie betrokken partijen, tenzij hiervoor door deelnemers uitdrukkelijk toestemming is gegeven.",
  "Indien de oorspronkelijke prijzen door overmacht niet geleverd kunnen worden, verzorgt Kiss FM vervangende prijzen. Kiss FM is niet aansprakelijk voor eventueel verlies tijdens de verzending van prijzen.",
  "Indien telefoonverbindingen wegvallen, of er zich andere technische problemen voordoen, kan het recht op de prijs vervallen. Kiss FM bepaalt het spelverloop op basis van objectieve gegevens die gegenereerd worden door de gebruikte software.",
  "Over beslissingen tijdens een spel wordt niet gecorrespondeerd. De beslissing van de dj tijdens het spel is definitief.",
  "Winnaars van acties op www.kissfm.nl krijgen bericht thuisgestuurd of per e-mail. Over de uitslag wordt niet gecorrespondeerd.",
  "Prijswinnaars dienen desgevraagd mee te werken aan (foto)sessies voor publicatie of commerciële doeleinden.",
  "Prijzen zijn niet inwisselbaar voor geld, diensten of andere goederen en zijn niet overdraagbaar.",
  "Af te dragen kansspelbelasting is voor rekening van Kiss FM wanneer het prijzen betreft in de vorm van goederen, producten en/of diensten. Bij geldprijzen komt, tenzij anders vermeld, de kansspelbelasting voor rekening van de winnaar. Kiss FM zal de verschuldigde kansspelbelasting op de (bruto) geldprijs inhouden en afdragen aan de Belastingdienst.",
  "Prijswinnaars zijn voor een periode van drie maanden uitgesloten van deelname aan een spel en/of actie. Bij het winnen van een zogeheten hoofdprijs bedraagt deze periode zes maanden. Indien een prijswinnaar binnen deze periode toch een prijs wint, behoudt Kiss FM zich het recht voor deze niet uit te keren. Indien een deelnemer onder meerdere of valse persoonsgegevens prijzen wint binnen deze gestelde periode, worden deze niet uitgekeerd.",
  "Deelnemers aan een spel of actie dienen minimaal 18 jaar oud te zijn, tenzij in de aanvullende voorwaarden anders is bepaald.",
  "Kiss FM behoudt zich het recht voor om inschrijvingen zonder opgaaf van reden te weigeren of te verwijderen.",
  "Medewerkers van Kiss FM dingen niet mee naar prijzen.",
  "Indien de prijs een reis betreft die wordt aangeboden door een externe partij, zal het boeken van de reis geschieden in overleg met die partij. Boeken gebeurt op basis van beschikbaarheid. De totale waarde van de reis wordt vooraf vastgesteld.",
].join("\n");

export const websiteTextGroups = [
  {
    page: "Homepagina",
    items: [
      {
        key: "HOME_PAGE_LAYOUT",
        label: "Startpagina (/)",
        fallback: "wave",
        selectOptions: [
          { value: "wave", label: "Wave (bento)" },
          { value: "classic", label: "Klassiek (artiestenmuur)" },
        ],
        section: "Algemeen",
      },
      {
        key: "HOME_HERO_KICKER",
        label: "Regel boven titel",
        fallback: "Live uit de studio",
        rows: 1,
        section: "Hero",
        pairedYesNoVisibilityKey: "HOME_HERO_KICKER_SHOW",
      },
      {
        key: "HOME_WAVE_POLAROIDS_SHOW",
        label: "Polaroid-strip",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Hero",
      },
      {
        key: "HOME_HERO_BACKDROP_MOTION",
        label: "Collage: schuivende rijen (foto’s: site-instellingen, Collage achtergrond)",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Aan (langzaam)" },
          { value: "no", label: "Uit (statisch)" },
        ],
        section: "Hero",
      },
      {
        key: "HOME_HERO_TITLE_1",
        label: "Titel — deel 1 (vaste tekst; geplande periodes: Geplande titels home)",
        fallback: "Alle hits van nu,",
        multiline: true,
        rows: 2,
        section: "Titel & intro",
      },
      {
        key: "HOME_HERO_TITLE_1_COLOR",
        label: "Kleur deel 1",
        fallback: "white",
        selectOptions: [
          { value: "white", label: "Wit" },
          { value: "teal", label: "Teal" },
        ],
        section: "Titel & intro",
      },
      {
        key: "HOME_HERO_TITLE_2",
        label: "Titel — deel 2",
        fallback: "altijd dichtbij",
        multiline: true,
        rows: 2,
        section: "Titel & intro",
      },
      {
        key: "HOME_HERO_TITLE_2_COLOR",
        label: "Kleur deel 2",
        fallback: "teal",
        selectOptions: [
          { value: "white", label: "Wit" },
          { value: "teal", label: "Teal" },
        ],
        section: "Titel & intro",
      },
      {
        key: "HOME_HERO_TITLE_LAYOUT",
        label: "Titelregels",
        fallback: "inline",
        selectOptions: [
          { value: "inline", label: "Naast elkaar" },
          { value: "stacked", label: "Onder elkaar" },
        ],
        section: "Titel & intro",
      },
      {
        key: "HOME_HERO_SUBTITLE",
        label: "Introtekst onder titel",
        fallback:
          "Luister live, check wie er op zender is en wat er zojuist gedraaid is. Hier hoor je de energie van KISS FM.",
        multiline: true,
        rows: 3,
        section: "Titel & intro",
        helpText:
          "^ = op smal scherm staand (portrait) een regeleinde, elders spaties. \"\"…\"\" = extra tekst voor tablet/PC en mobiel liggend; op portrait-mobiel wordt dat blok helemaal weggelaten (niet verborgen), dus geen lege ruimte. ''…'' = extra tekst alleen op portrait-mobiel; op grotere weergave weggelaten.",
      },
      {
        key: "HOME_WAVE_NOW_LABEL",
        label: "Player — label nu",
        fallback: "Dit hoor je nu",
        section: "Live player",
      },
      {
        key: "HOME_WAVE_NEXT_LABEL",
        label: "Player — label straks",
        fallback: "Dit hoor je straks",
        section: "Live player",
      },
      {
        key: "HOME_WAVE_LIVE_LABEL",
        label: "Player — live-badge",
        fallback: "Live",
        section: "Live player",
      },
      { key: "HOME_SIDEBAR_TITLE", label: "Kolom rechts — titel", fallback: "De stemmen van KISS", section: "Panelen" },
      { key: "HOME_RECENT_TRACKS_TITLE", label: "Laatste tracks — titel", fallback: "Laatste 5 tracks", section: "Panelen" },
      { key: "HOME_RECENT_TRACKS_CTA", label: "Laatste tracks — linktekst", fallback: "Volledige geschiedenis", section: "Panelen" },
      { key: "HOME_CURRENT_SHOW_TITLE", label: "Programmering-paneel — titelbadge (wave)", fallback: "SCHEDULE", section: "Panelen" },
      {
        key: "HOME_CURRENT_SHOW_CTA",
        label: "Programmering — linktekst (alleen legacy-paneel)",
        fallback: "Volledige programmering",
        section: "Panelen",
      },
      { key: "HOME_CONCERTS_TITLE", label: "Concerten — titel", fallback: "Concerten", section: "Panelen" },
      {
        key: "HOME_SHOW_LIPS_LOGO",
        label: "Hero: KISS lippen tonen",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      {
        key: "HOME_PANEL_CURRENT_SHOW",
        label: "Panel: Nu op zender",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      {
        key: "HOME_PANEL_RECENT_TRACKS",
        label: "Panel: Laatste tracks",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      {
        key: "HOME_PANEL_CONCERTS",
        label: "Panel: Concerten",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      {
        key: "HOME_PANEL_VOICES",
        label: "Panel: DJ-kolom rechts",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      {
        key: "HOME_PANEL_INSTAGRAM",
        label: "Panel: Instagram",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      {
        key: "HOME_PANEL_TIKTOK",
        label: "Panel: TikTok",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      { key: "HOME_INSTAGRAM_PANEL_TITLE", label: "Instagram panel — titel", fallback: "Instagram", section: "Panelen" },
      { key: "HOME_TIKTOK_PANEL_TITLE", label: "TikTok panel — titel", fallback: "TikTok", section: "Panelen" },
      { key: "HOME_INSTAGRAM_PROFILE_URL", label: "Instagram profiel URL", fallback: "https://instagram.com/kissfmnl", section: "Panelen" },
      { key: "HOME_TIKTOK_PROFILE_URL", label: "TikTok profiel URL", fallback: "https://www.tiktok.com/@kissfmnl", section: "Panelen" },
      {
        key: "HOME_APP_POPUP_SHOW",
        label: "Popup: Download de app",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      { key: "HOME_APP_POPUP_TITLE", label: "Popup titel", fallback: "Download de KISS FM app", section: "Panelen" },
      { key: "HOME_APP_POPUP_BODY", label: "Popup tekst", fallback: "Luister live, stem op de KISS40 en mis geen hit.", section: "Panelen" },
      { key: "HOME_APP_POPUP_URL", label: "Popup knop URL", fallback: "/frequenties", section: "Panelen" },
      { key: "HOME_APP_POPUP_CTA", label: "Popup knop tekst", fallback: "Open app links", section: "Panelen" },
      {
        key: "COOKIE_BANNER_SHOW",
        label: "Cookie melding",
        fallback: "yes",
        selectOptions: [
          { value: "yes", label: "Tonen" },
          { value: "no", label: "Verbergen" },
        ],
        section: "Panelen",
      },
      {
        key: "COOKIE_BANNER_TEXT",
        label: "Cookie melding tekst",
        fallback: "Wij gebruiken alleen functionele cookies om de site goed te laten werken.",
        multiline: true,
        rows: 2,
        section: "Panelen",
      },
      { key: "COOKIE_BANNER_CTA", label: "Cookie melding knop", fallback: "Ok, begrepen", section: "Panelen" },
      { key: "FALLBACK_ALBUM_LOGO_PATH", label: "Fallback album-cover logo pad (Website/...)", fallback: "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png", section: "Panelen" },
      { key: "FALLBACK_ALBUM_BG_COLOR", label: "Fallback album-cover achtergrondkleur (#hex)", fallback: "#f2f8fb", section: "Panelen" },
    ],
  },
  {
    page: "Playlist",
    items: [
      { key: "PLAYLIST_HERO_KICKER", label: "Label boven hoofdtitel (hero)", fallback: "KISS FM" },
      { key: "PLAYLIST_PAGE_TITLE", label: "Hoofdtitel pagina", fallback: "Playlist" },
      {
        key: "PLAYLIST_SUBTITLE",
        label: "Ondertitel onder titel (hero)",
        fallback:
          "Kies een dag (vandaag t/m 7 dagen terug) en een uur (standaard nu). Alleen uren die al voorbij zijn — meest recente uren bovenaan.",
      },
      { key: "PLAYLIST_VOTE_HINT", label: "Stem-uitleg (onder filters)", fallback: "" },
      { key: "PLAYLIST_NOW_PLAYED_LABEL", label: "Label nu live-blok", fallback: "Nu op de radio" },
      { key: "PLAYLIST_HISTORY_SUBTITLE", label: "Kop boven raster", fallback: "Meest recent bovenaan" },
    ],
  },
  {
    page: "KISS40",
    items: [
      {
        key: "KISS40_DESCRIPTION",
        label: "Introtekst",
        fallback:
          "Elk weekend vanaf 16:00 uur hoor je Bas van Teylingen met de 40 grootste hits van het moment in de KISS40. Samengesteld door jou via de KISS app, website en sociale media.",
      },
      { key: "KISS40_HELP_TEXT", label: "Hulptitel boven playlist", fallback: "Benieuwd naar de lijst van deze week? Check 'm hieronder!" },
    ],
  },
  {
    page: "Programmering",
    items: [
      { key: "PROGRAMMERING_SUBTITLE", label: "Introtekst", fallback: "Dit hoor je deze week op KISS FM." },
      { key: "PROGRAMMERING_LIVE_BADGE", label: "Live pill-tekst", fallback: "Nu op radio" },
    ],
  },
  {
    page: "Acties",
    items: [
      { key: "ACTIES_PAGE_TITLE", label: "Hoofdtitel pagina", fallback: "Acties" },
      {
        key: "ACTIES_SUBTITLE",
        label: "Ondertitel onder titel",
        fallback: "Overzicht van lopende acties. Doe mee en maak kans op leuke prijzen.",
      },
      { key: "ACTIES_THROWBACK_CARD_STATUS", label: "Kaart: statuslabel", fallback: "Lopend" },
      { key: "ACTIES_THROWBACK_CARD_TITLE", label: "Kaart: titel", fallback: "KISS Throwback Party" },
      {
        key: "ACTIES_THROWBACK_CARD_BODY",
        label: "Kaart: korte omschrijving",
        fallback: "Bedrijven kiezen samen met hun team de ultieme throwback playlist en maken kans op een prijs.",
      },
      { key: "ACTIES_THROWBACK_CARD_CTA", label: "Kaart: knoptekst", fallback: "Naar actie" },
    ],
  },
  {
    page: "Throwback Party",
    items: [
      { key: "THROWBACK_KICKER", label: "Label boven titel", fallback: "Actie" },
      { key: "THROWBACK_TITLE", label: "Hoofdtitel", fallback: "KISS Throwback Party" },
      { key: "THROWBACK_STEP1_SUBTITLE", label: "Ondertitel stap 1", fallback: "Stap 1 van 2: stel je teamplaylist samen." },
      { key: "THROWBACK_STEP2_SUBTITLE", label: "Ondertitel stap 2", fallback: "Stap 2 van 2: vul je gegevens in en verstuur je inzending." },
      { key: "THROWBACK_SUCCESS_TITLE", label: "Succes: titel", fallback: "Top! Jullie inzending is ontvangen." },
      { key: "THROWBACK_SUCCESS_CTA", label: "Succes: knoptekst", fallback: "Nieuwe inzending starten" },
      { key: "THROWBACK_BACK_CTA", label: "Stap 2: terugknop", fallback: "← Terug naar nummerselectie" },
    ],
  },
  {
    page: "DJ's",
    items: [{ key: "DJS_SUBTITLE", label: "Introtekst", fallback: "Onze jocks." }],
  },
  {
    page: "Contact",
    items: [
      { key: "CONTACT_SUBTITLE", label: "Introtekst", fallback: "Contactgegevens en samenwerkingen. (Geen nieuwsblok, wel strak en duidelijk.)" },
      { key: "CONTACT_EMAIL", label: "E-mail", fallback: "info@kissfm.nl" },
      { key: "CONTACT_WHATSAPP_TEXT", label: "WhatsApp tekst/nummer", fallback: "+31 800 1078" },
      { key: "CONTACT_ADDRESS", label: "Adres", fallback: "P.J Oudweg 4, 1314 CH, Almere" },
      { key: "CONTACT_HOURS", label: "Bereikbaarheid", fallback: "Ma-vr 09:00 - 17:00" },
    ],
  },
  {
    page: "Social links",
    items: [
      { key: "PUBLIC_INSTAGRAM_URL", label: "Instagram URL", fallback: "https://instagram.com/kissfmnl" },
      { key: "PUBLIC_WHATSAPP_URL", label: "WhatsApp URL", fallback: "https://wa.me/318001078" },
      { key: "PUBLIC_TIKTOK_URL", label: "TikTok URL", fallback: "https://www.tiktok.com/@kissfmnl" },
      { key: "PUBLIC_LINKEDIN_URL", label: "LinkedIn URL", fallback: "https://www.linkedin.com/company/kiss-fm-nl/" },
    ],
  },
  {
    page: "Disclaimer",
    items: [
      { key: "LEGAL_PAGE_TITLE", label: "Paginatitel", fallback: "Wettelijke vermeldingen" },
      {
        key: "LEGAL_PAGE_CONTENT",
        label: "Inhoud (één doorlopende tekst)",
        fallback: `WETTELIJKE VERMELDINGEN - KISS FM

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

Wij streven ernaar binnen 14 werkdagen een inhoudelijke reactie te geven.`,
        multiline: true,
        rows: 24,
      },
    ],
  },
  {
    page: "Frequenties",
    items: [
      {
        key: "FREQUENTIES_FM_PANEL_TITLE",
        label: "Kop boven frequentielijst",
        fallback: "Op FM en DAB+",
        rows: 1,
      },
      { key: "FREQUENTIES_SUBTITLE", label: "Tekst onder die kop (paragraaf)", fallback: "Via de website en onze app heb je ons altijd bij je. Gratis te downloaden via de App Store en Google Play. Ook op DAB+ zijn we in heel Nederland te horen. En natuurlijk via FM in de Randstad." },
      {
        key: "FREQUENTIES_LINES",
        label: "Frequenties (één per regel)",
        fallback: DEFAULT_FREQUENTIES_LINES,
        multiline: true,
        rows: 10,
      },
      {
        key: "FREQUENTIES_APP_TITLE",
        label: "App-blok: kop",
        fallback: "Luister overal ter wereld",
        rows: 1,
      },
      {
        key: "FREQUENTIES_APP_BODY",
        label: "App-blok: tekst",
        fallback:
          "Download de gratis KISS FM-app voor iPhone en Android en neem ons mee, waar je ook bent — streamen via internet of de app.",
        multiline: true,
        rows: 3,
      },
    ],
  },
  {
    page: "Studio reservering",
    items: [
      { key: "STUDIO_BOOKING_URL", label: "Agenda URL", fallback: "https://calendar.online/cd0577e1ec69b88742e9" },
      {
        key: "STUDIO_BOOKING_NOTE",
        label: "Uitlegtekst",
        fallback: "Via deze agenda kunnen mensen de studio reserveren om op te nemen.",
      },
    ],
  },
  {
    page: "Join KISS",
    items: [
      { key: "JOIN_KISS_PAGE_TITLE", label: "Hoofdtitel", fallback: "Werken bij KISS FM", rows: 1 },
      {
        key: "JOIN_KISS_INTRO",
        label: "Introtekst (onder header)",
        fallback:
          "De grootste poptracks van dit moment hebben een nieuwe sound nodig. Ben jij een echte hitradio-jock, producer of wil je op een andere manier meebouwen? KISS FM zoekt mensen met passie voor radio en muziek.",
        multiline: true,
        rows: 5,
      },
      { key: "JOIN_KISS_VACANCIES_TITLE", label: "Kop boven vacaturekaarten", fallback: "Vacatures", rows: 1 },
      {
        key: "JOIN_KISS_BENEFITS_TITLE",
        label: "Kop boven voordelen",
        fallback: "Waarom bij KISS werken",
        rows: 1,
      },
    ],
  },
  {
    page: "Giveaway / actievoorwaarden",
    items: [
      {
        key: "GIVEAWAY_TERMS_PAGE_TITLE",
        label: "Paginatitel",
        fallback: "Giveaway Terms and Conditions",
      },
      {
        key: "GIVEAWAY_TERMS_BULLETS",
        label: "Voorwaarden (één bullet per regel)",
        fallback: DEFAULT_GIVEAWAY_TERMS_BULLETS,
        multiline: true,
        rows: 22,
      },
    ],
  },
];

export type WebsiteTextItem = {
  key: string;
  label: string;
  fallback: string;
  selectOptions?: { value: string; label: string }[];
  multiline?: boolean;
  rows?: number;
  /** Korte uitleg onder het label in de editor (bijv. speciale tekens). */
  helpText?: string;
  /** Optionele subkop binnen een pagina-tab (alleen voor overzicht in de editor). */
  section?: string;
  /**
   * Opslag in `pairedYesNoVisibilityKey` als yes/no; in de editor een oogje naast dit veld i.p.v. aparte rij.
   * Standaard fallback voor die key: "yes".
   */
  pairedYesNoVisibilityKey?: string;
};

/** Alle siteSetting-keys voor website-teksten (inclusief gekoppelde zichtbaarheid). */
export function allWebsiteTextSettingKeys(): string[] {
  const keys = new Set<string>();
  for (const g of websiteTextGroups) {
    for (const raw of g.items) {
      const i = raw as WebsiteTextItem;
      keys.add(i.key);
      if (i.pairedYesNoVisibilityKey) keys.add(i.pairedYesNoVisibilityKey);
    }
  }
  return Array.from(keys);
}
