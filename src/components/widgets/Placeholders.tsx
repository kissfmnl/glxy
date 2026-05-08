/**
 * Placeholder Widgets voor het KISS FM Dashboard.
 *
 * Elk component is een visueel duidelijk lege widget die aangeeft welke
 * functionaliteit hier later zal komen. De structuur is zo opgezet dat je
 * de inhoud eenvoudig kunt vervangen door een echte implementatie:
 *
 * 1. Maak een nieuw component in /components/widgets/<WidgetNaam>.tsx
 * 2. Vervang de placeholder export hieronder door de import van jouw component
 * 3. Voeg indien nodig props toe aan het Bento-grid in /app/dashboard/page.tsx
 */

interface PlaceholderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  comingSoon?: string;
}

function PlaceholderWidget({ icon, title, description, comingSoon }: PlaceholderProps) {
  return (
    <div className="card flex h-full min-h-[176px] flex-col items-center justify-center rounded-3xl border border-gray-200/80 p-6 text-center dark:border-white/10">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-brand-muted">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-[220px] text-xs text-brand-muted">{description}</p>
      {comingSoon ? (
        <span className="mt-4 rounded-full border border-brand-border bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
          {comingSoon}
        </span>
      ) : null}
    </div>
  );
}

// =====================================================================
// Placeholder: Actuele Verkeersinformatie
// TODO: Koppel hier de NDW Verkeersdata API of een andere verkeersbron.
//       Zie: https://opendata.ndw.nu/ voor gratis verkeersdata.
//       Vervang dit component door: /components/widgets/TrafficWidget.tsx
// =====================================================================
export function TrafficPlaceholder() {
  return (
    <PlaceholderWidget
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 13l4.553 2.276A1 1 0 0021 21.382V10.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9 4" />
        </svg>
      }
      title="Actuele verkeersinformatie"
      description="Live updates van files, incidenten en wegwerkzaamheden."
      comingSoon="Koppel ndw / google maps api"
    />
  );
}

// =====================================================================
// Placeholder: Studio Logger
// TODO: Verbind hier met jullie interne logging-systeem.
//       Typisch loggt dit: song starts/stops, mic-opens, voice-tracks, etc.
//       Vervang dit component door: /components/widgets/StudioLoggerWidget.tsx
// =====================================================================
export function StudioLoggerPlaceholder() {
  return (
    <PlaceholderWidget
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      }
      title="Studio logger"
      description="Automatische registratie van studio-events en uitzendingen."
      comingSoon="Koppel intern logging-systeem"
    />
  );
}

// =====================================================================
// Placeholder: OmniPlayer Now Playing
// TODO: Gebruik de OmniPlayer REST API of WebSocket feed.
//       De API geeft: title, artist, album art, duration, progress.
//       Documentatie: vraag bij OmniPlayer naar de API-sleutel en endpoint.
//       Vervang dit component door: /components/widgets/NowPlayingWidget.tsx
//
//       Voorbeeld API call:
//       const data = await fetch(`${process.env.OMNIPLAYER_API_URL}/nowplaying`, {
//         headers: { 'Authorization': `Bearer ${process.env.OMNIPLAYER_API_KEY}` }
//       }).then(r => r.json());
// =====================================================================
export function OmniPlayerPlaceholder() {
  return (
    <PlaceholderWidget
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      }
      title="OmniPlayer now playing"
      description="Huidig draaiend nummer, artiest en album art."
      comingSoon="Koppel OmniPlayer api"
    />
  );
}
