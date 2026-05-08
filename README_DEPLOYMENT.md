# GLXY Radio — Deployment

**Huidige `main`:** Next.js met Prisma/PostgreSQL, NextAuth en Railway-start (`npm start` → `db push`, `seed`, `next start`). Zie **[RAILWAY.md](./RAILWAY.md)** voor omgevingsvariabelen (`DATABASE_URL` alleen; geen hardcoded DB-hosts in de repo).

`npm run build` bundelt de app; database-connectie gaat **uitsluitend** via `DATABASE_URL`.

## 1. Vereisten

- Node 20.x (aanbevolen, zie engines in package-lock peer hints)
- `npm ci` of `npm install`

## 2. Lokaal

```bash
npm install
npm run dev
```

Productie-build lokaal testen:

```bash
npm run build
npm start
```

In productie/lokaal met DB: zet **`DATABASE_URL`** (zie `.env.example`). Zonder DB faalt auth/admin.

## 3. Omgeving (optioneel)

Alleen nog relevant als je lokale overrides wilt:

| Variabele | Gebruik |
|-----------|---------|
| `MONITOR_PAGE_CODE` | Toegangscode voor `/monitor` (zie app); zonder deze var geldt een eenvoudige default in code. |

Zie **`.env.example`** voor een minimaal sjabloon.

## 4. CI / hosting‑tips

- **Build‑command:** `npm run build`
- **Start‑command:** `npm start`
- **Health:** HTTP 200 op de homepage is voldoende; er is geen aparte readiness‑DB.

## Uploads / bestanden (optioneel)

Voor schrijven naar `Website/` op schijf: zie `WEBSITE_FILES_ROOT` in code (`src/lib/websiteDisk.ts`). Dit staat los van de database; gebruik geen vast volume-pad voor Postgres — alleen `DATABASE_URL`.
