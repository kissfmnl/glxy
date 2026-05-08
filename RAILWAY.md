# Deploying GLXY on Railway

> **Niet technisch?** Lees eerst **[docs/START-HIER-RAILWAY.md](./docs/START-HIER-RAILWAY.md)** — daar staat hoe je `db push` doet **vanaf je Mac** met **`DATABASE_PUBLIC_URL`** (aanbevolen). `npm run db:push:railway` faalt vaak lokaal omdat Railway een **interne** host gebruikt die alleen op hun servers werkt.

De app gebruikt alleen **omgevingsvariabelen** op Railway (geen `.env.local` in productie).

**Database:** Er staat **geen** vaste hostnaam, volume-mount (`postgres-volume`) of pad in deze repo. Prisma leest alleen `process.env.DATABASE_URL` (`url = env("DATABASE_URL")` in `prisma/schema.prisma`). Stel `DATABASE_URL` in bij je web-service (bijv. **Variable Reference** naar de Postgres-plugin).

Er is geen verplichte `nixpacks.toml`; Nixpacks detecteert Node automatisch. Er staat wel een minimale `railway.json` met het startcommando.

## Build & start (repository)

- **Build:** `npm run build` → draait `prisma generate && next build`.
- **Start:** `npm start` → `prisma db push && prisma db seed && next start -H 0.0.0.0`  
  (`PORT` wordt door Railway gezet; Next.js leest `PORT` automatisch.)
- **Alleen Next (zonder DB-migratie):** `npm run start:next-only` — alleen als je zelf migrations beheert.

`prisma` en `tsx` staan in **dependencies** zodat `db push` en `db seed` ook werken als devDependencies niet geïnstalleerd zijn.

## Checklist: variabelen op je Railway *web*-service

Zet deze op de service die **Next.js** draait (niet alleen op de Postgres-plugin).

### Verplicht

| Variable | Voorbeeld / uitleg |
|----------|---------------------|
| `DATABASE_URL` | Gebruik **Reference** naar je Railway Postgres: “Add variable” → “Reference” → Postgres → `DATABASE_URL` (interne URL is ok voor app + DB op hetzelfde project). |
| `NEXTAUTH_URL` | Exact de publieke origin, **zonder** slash op het eind: `https://glxy-production.up.railway.app` |
| `NEXTAUTH_SECRET` | Lange random string, bv. `openssl rand -base64 32` (één keer genereren en vasthouden). |

### Aanbevolen (proxy / uitnodigingslinks)

| Variable | Waarde |
|----------|--------|
| `AUTH_TRUST_HOST` | `true` — helpt NextAuth achter Railway’s reverse proxy (forwarded host / HTTPS). |

### Eerste beheerder (optioneel maar handig bij eerste deploy)

Alleen nodig als de database nog **geen** `User`-rijen heeft. De seed maakt dan één admin aan.

| Variable | Uitleg |
|----------|--------|
| `ADMIN_BOOTSTRAP_EMAIL` | E-mail van de eerste admin. |
| `ADMIN_BOOTSTRAP_PASSWORD` | Minimaal 8 tekens. |

Na de eerste geslaagde seed kun je deze twee verwijderen of leeg laten (veiliger).

### Optioneel

| Variable | Uitleg |
|----------|--------|
| `WEBSITE_FILES_ROOT` | **Aanbevolen voor uploads** (`/admin/media`, logo’s): absoluut pad op de container waar `Website/media/` bewaard blijft (bijv. een Railway **Volume**-mountpunt). Zonder dit blokkeert de app schrijven in productie, tenzij je `ALLOW_EPHEMERAL_WEBSITE_FILES=1` zet (uploads kunnen bij elke deploy/restart weg). |
| `ALLOW_EPHEMERAL_WEBSITE_FILES` | `1` — sta upload toe naar de tijdelijke schijf (niet persistent). Alleen handig om snel te testen. |
| `NEXT_PUBLIC_GLXY_HLS_URL` | Fallback HLS-URL als branding in de DB niet bereikbaar is. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Uitnodigingsmail; zonder SMTP blijft de **invite-link** in `/admin/gebruikers` kopieerbaar. |
| `PRISMA_DEBUG` | `1` — Prisma logging (alleen voor debug). |

## Postgres-plugin

- Koppel **Postgres** aan het project en **reference** `DATABASE_URL` naar de Next-service.
- Voor **lokaal** ontwikkelen: gebruik `DATABASE_PUBLIC_URL` uit Railway met `?sslmode=require` (zie `.env.example`).

## Verificatie na deploy

1. Homepage laadt; livestream blok speelt (muted) als `Branding`/HLS-url klopt.
2. `/login` — inloggen met bootstrap- of geïnviteerd account.
3. `/admin/gebruikers` en `/admin/branding` — alleen als je `ADMIN` bent.

Als cookies/auth misgaan: controleer `NEXTAUTH_URL` (exact `https://…`), `NEXTAUTH_SECRET`, en `AUTH_TRUST_HOST=true`.
