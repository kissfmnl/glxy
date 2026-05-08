# GLXY — volgende stappen na migratie van KISS

De KISS-stack draait nu in deze repo onder **`glxy`** (Next.js **14.2.x**, React 18, Prisma 5, NextAuth 4, Tailwind 3). Gebruik dit als checklist en als gefaseerd plan om verder naar een moderne stack te tillen zonder big bang.

## 1. Lokaal werkend krijgen (checklist)

1. **Postgres** installeren/starten en een database aanmaken (bijv. `kissfm` of eigen naam).

2. **Omgevingsvariabelen**
   ```bash
   cp .env.example .env.local
   ```
   - Vul minstens **`DATABASE_URL`**, **`NEXTAUTH_SECRET`**, **`NEXTAUTH_URL`** (`http://localhost:3000` lokaal).
   - Kopieer de overige secrets van je oude KISS `.env.local` waar nodig (WhatsApp, cron, SMTP, …).

3. **Database schema**
   - Snel synchroon met schema:
     ```bash
     npm run db:push
     ```
     of gebruik migraties vanuit `prisma/migrations/` als je daar al op productie draait.

4. **`Website/` persistentie** (uploads/logo’s)
   - Lokaal: map staat in de repo-root; uploads gaan daaronder naar `Website/…`.
   - Productie: zet **`WEBSITE_FILES_ROOT`** naar je volume (zie `.env.example`).

5. **Start**
   ```bash
   npm install
   npm run dev
   ```

Zie ook `README_DEPLOYMENT.md` voor Railway/GitHub-deployment.

## 2. gefaseerd moderniseren (aanbevolen volgorde)

### Fase A — stabiel & meetbaar (laag risico)

- ESLint warnings opruimen die je tot errors wilt maken bij build (`next/image`, `react-hooks/exhaustive-deps`).
- Geen majeure dependency-bumps.

### Fase B — Next.js 15 compat

- Lees vóór de bump de relevante gids onder `node_modules/next/dist/docs/` (Next wijkt af per versie).
- Bump **Next → 15.x** nog op **React 18** waar mogelijk.
- **`next lint`** / ESLint configuratie naar flat config kan later (ESLint 9).

### Fase C — Next.js 16 + React 19 (+ Tailwind 4)

- Project was ooit een Next 16-stub; deze repo is terug naar 14 voor 1-op-1 KISS-compat.
- Plan: ná Fase B: **React 19** + **Next 16**, daarna **`@tailwindcss/postcss`** + Tailwind v4 en `tailwind.config` migratie.
- Controleer `middleware`, `cookies()`, en alle server actions tegen de nieuwe Next-docs.

### Fase D — Authenticatie

- **[Auth.js](https://authjs.dev/) / NextAuth v5)** is een apart project: routes, callbacks en types wijken af van v4.
- Doe dit géén combinatie-upgrade met Next-major in één stap.

### Fase E — GLXY-identiteit / product splits

- Herbenoemen waar nodig (package name, branding, domeinen, kopieën).
- Optioneel: `Website/` structuur naar `public/` of alleen CDN/volume-documentatie aanpassen (raakt veel paden en DB).

## 3. Praktische regressietest (kort)

Na elke bump: `npm run build`, login-flow, `/api/auth`, prisma-read path, uploads via bestanden-interface, webhook/cron waar je die gebruikt.
