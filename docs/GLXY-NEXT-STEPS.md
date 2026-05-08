# GLXY Radio — volgende stappen

## Huidige stand (frontend‑only)

De **main**-branch bouwt als **statische demo**: Next.js **14.2.x**, React 18, Tailwind 3. Geen Prisma, geen NextAuth, geen `src/app/api`, geen WhatsApp‑webhook — alle publieke inhoud komt uit **`src/lib/mock/site.ts`**.

- Lokaal: `npm install` → `npm run dev`
- CI: `npm run lint`, `npm run build`

Deploy: zie **`README_DEPLOYMENT.md`**.

## Als je backend opnieuw wilt (later)

Dan is dit een nieuw ontwerp‑traject o.a.:

1. Kiezen tussen Auth.js / eigen sessies / ander IdP  
2. Databaselayer (PostgreSQL + ORM naar keuze)  
3. File storage (CDN/volume i.p.v. oude `Website/`-routes)  
4. Integraties opnieuw aansluiten (stream‑metadata, social, ticketing, enz.)

De oude KISS‑stack (Prisma‑schema, migraties, server actions) is uit deze tak verwijderd om de UI vrij te kunnen draaien zonder Postgres.

## Gefaseerd moderniseren (UI / framework)

### Fase A — stabiel houden

- ESLint: `npm run lint` groen  
- **`next.config.mjs`**: `images.unoptimized` waar nodig voor willekeurige externe Unsplash/mock‑URLs met `next/image`.

### Fase B — Next 15–16

- Altijd eerst **`node_modules/next/dist/docs/`** voor deze repo (zie `AGENTS.md`).  
- Niet auth + Next‑major tegelijk updaten tenzij je de migratiegidsen volgt.

### Fase C — GLXY product‑identiteit

- Domeinen, legal copy en eventueel eigen assets i.p.v. Unsplash placeholders.  
- Eventueel design tokens verder naar één Neon/Galaxy‑systeem in CSS variabelen.

## Regressie (kort) na wijzigingen

Na elke relevante bump: `npm run build` en smoke‑test: `/`, `/playlist`, `/programmering`, `/djs`.
