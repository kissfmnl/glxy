# GLXY Radio

Next.js-app met Prisma (PostgreSQL), NextAuth, mediabibliotheek en Railway-deploy.

---

## Dagelijkse workflow (aan te raden)

1. **Code aanpassen** in Cursor (of je editor).

2. **Committen en naar GitHub pushen:**

   ```bash
   git add .
   git commit -m "Update GLXY site"
   git push
   ```

3. **GitHub** ontvangt de commit op branch **`main`**.

4. **Railway** bouwt en deployt automatisch als je project aan **`main`** hangt (zie onder “Railway eenmalig”).

5. **Live app** gebruikt alleen omgevingsvariabelen op Railway — **`DATABASE_URL`** wijst naar je PostgreSQL-plugin (meestal als **Variable Reference**). Er is **geen** `.env.local` op de server.

---

## Scripts (`package.json`)

| Commando | Wat het doet |
|----------|----------------|
| `npm run dev` | Lokale ontwikkeling (`localhost:3000`). |
| `npm run build` | `prisma generate` daarna `next build` (zo op Railway). |
| `npm start` | **Productie:** `prisma db push` → `prisma db seed` → `next start -H 0.0.0.0` (`PORT` door Railway gezet). |
| `npm run start:next-only` | Alleen Next starten (zonder db push/seed). |
| `npm run db:push` | Alleen schema naar DB (lokaal: zet `DATABASE_URL`). |
| `npm run db:push:env` | `db push` met `.env.railway` (publieke Railway-URL vanaf je Mac). |
| `npm run db:push:railway` | Via Railway CLI (zie `docs/START-HIER-RAILWAY.md`). |

Na **`npm install`** draait **`postinstall`** automatisch **`prisma generate`** (handig op Railway).

---

## Database (Prisma)

- In **`prisma/schema.prisma`** staat alleen:  
  `url = env("DATABASE_URL")` — **geen** vaste URL in de code.
- **Productie:** alleen `process.env.DATABASE_URL` zoals Railway die injecteert.
- **Lokaal:** kopieer `.env.example` naar **`.env.local`** (staat in `.gitignore`, wordt **niet** gecommit).

---

## Railway (eenmalig instellen)

1. Nieuw project of bestaand project op [Railway](https://railway.app).
2. Service vanuit **GitHub** koppelen, branch **`main`**, automatische deploys aan.
3. **PostgreSQL** toevoegen en op je web-service **`DATABASE_URL`** laten verwijzen naar die database (**Reference** naar de Postgres-service).
4. Op de **web-service** (Next.js) minimaal zetten:
   - **`DATABASE_URL`** — reference naar Postgres (interne URL is ok op Railway).
   - **`NEXTAUTH_URL`** — je publieke URL, bv. `https://jouw-app.up.railway.app` (geen `/` aan het eind).
   - **`NEXTAUTH_SECRET`** — lange willekeurige string.
   - **`AUTH_TRUST_HOST=true`** — aanbevolen achter Railway-proxy.

Volledige checklist: **[`RAILWAY.md`](./RAILWAY.md)**.

Database bijwerken **vanaf je Mac** (publieke URL): **[`docs/START-HIER-RAILWAY.md`](./docs/START-HIER-RAILWAY.md)**.

---

## NextAuth (productie)

- **`NEXTAUTH_URL`** moet exact je live origin zijn (https + domein van Railway).
- Geen `.env.local` nodig op Railway — alleen dashboard-variabelen.

---

## Bestanden die níet op GitHub horen

- **`.env.local`**, **`.env.railway`**, andere `.env*` — staan in **`.gitignore`** (behalve **`.env.example`** als sjabloon).
- Commit **geen** wachtwoorden of connection strings.

---

## Meer documentatie

| Bestand | Inhoud |
|---------|--------|
| [`RAILWAY.md`](./RAILWAY.md) | Variabelen, uploads (`WEBSITE_FILES_ROOT`), troubleshooting |
| [`docs/START-HIER-RAILWAY.md`](./docs/START-HIER-RAILWAY.md) | `db push` vanaf laptop met `DATABASE_PUBLIC_URL` |
| [`README_DEPLOYMENT.md`](./README_DEPLOYMENT.md) | Korte deploy-notities |
| [`railway.json`](./railway.json) | Startcommando `npm start` voor Railway |

---

## Lokale ontwikkeling

```bash
npm install
cp .env.example .env.local   # vul DATABASE_URL en NEXTAUTH_* in
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
