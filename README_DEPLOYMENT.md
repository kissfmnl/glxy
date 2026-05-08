# GLXY — Deployment (Railway / GitHub)

Deze repo bevat de gemigreerde KISS-site stack. Deploy volgt hetzelfde patroon: GitHub ↔ Railway met Postgres.

Zie **`docs/GLXY-NEXT-STEPS.md`** voor lokale setup en een gefaseerd upgrade-pad (Next / Tailwind / auth).

## 1. GitHub

Als git al geïnitialiseerd is met remote **`origin`**:

```bash
git add .
git commit -m "Your message"
git push -u origin main
```

Let op: `.env.local` wordt door `.gitignore` genegeerd; commit geen secrets.

## 2. Deployen naar Railway
1.  Log in op [Railway.app](https://railway.app).
2.  Kies **New Project** → **Deploy from GitHub repo**.
3.  Selecteer je repository.
4.  Voeg een **PostgreSQL** database toe aan je project in Railway (**New** → **Database** → **Add PostgreSQL**).

## 3. Environment Variables (Railway)
Voeg de volgende variabelen toe aan je Railway service:
- `DATABASE_URL`: Wordt automatisch ingevuld door Railway als je een Postgres plugin toevoegt.
- `NEXTAUTH_SECRET`: Een lange willekeurige tekenreeks.
- `NEXTAUTH_URL`: De URL van je Railway app (bijv. `https://kiss-fm-portal.up.railway.app`).
- `WHATSAPP_VERIFY_TOKEN`: Jouw geheime token voor de webhook.
- `WHATSAPP_API_TOKEN`: Jouw Meta API token.
- `WHATSAPP_PHONE_NUMBER_ID`: Jouw Meta Phone ID.

## 4. Database Sync
Railway voert `npm run build` uit. Zorg dat je `package.json` de juiste prisma commando's heeft.
Ik heb `prisma generate` al in het build-proces gezet. Na de eerste deploy kun je in de Railway terminal runnen:
```bash
npx prisma db push
```

## Toekomstige Ideeën (v0.2)
- **Track Progress**: Visuele balk die laat zien hoe ver een nummer is.
- **Luistercijfers**: Live statistieken van het aantal luisteraars.
- **Direct Reply**: Reageren op WhatsApp berichten direct vanuit het portaal.
- **Regionale Edities**: Schakelen tussen verschillende KISS-regiofeeds.
