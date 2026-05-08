# GLXY Radio — Deployment (statische frontend)

Deze repo is een **Next.js-demo** zonder database, API-routes of Prisma: `npm run build` produceert een volledige statische/UI-bundle. Hosting is daarom vooral **Node + `next start`** of een platform dat dat ondersteunt (Vercel, Railway als Node service zonder Postgres, Docker, eigen VPS).

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

Geen **`DATABASE_URL`**, geen migrations, geen seed-scripts.

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

## Toekomst (als je weer backend toevoegt)

Dan kun je Postgres, auth en uploads opnieuw introduceren; houd deze README dan synchroon met `package.json` en je schema. De huidige `main`-branch beschrijft bewust alleen de **statische GLXY‑Radio‑UI**.
