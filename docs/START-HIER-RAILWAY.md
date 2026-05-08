# Start hier: Railway-database bijwerken

Je hoeft niet te weten wat Prisma of `db push` precies doet. Je wilt alleen dat de **database op Railway** dezelfde tabellen heeft als je code.

---

## Wat het vaak al automatisch doet

Elke keer als Railway je site **opnieuw bouwt en start**, draait het script `npm start` al **`prisma db push`** vóór de site online gaat.  
**Na een gewone deploy hoef je dus vaak niets handmatig te doen.**

Alleen als je denkt dat iets niet klopt (nieuwe kolommen komen niet online), gebruik dan hieronder één van de twee methodes.

---

## Methode A — Railway CLI (aanbevolen)

### Eén keer installeren

Open **Terminal** op je Mac en voer uit:

```bash
brew install railway
```

(Werkt `brew` niet? Zie [Railway CLI](https://docs.railway.com/develop/cli) voor andere installatie.)

### Eén keer inloggen en koppelen

```bash
railway login
```

(Browser opent; log in bij Railway.)

Ga naar je projectmap (waar deze repo staat):

```bash
cd /pad/naar/glxy
```

Koppel de map aan je Railway-project:

```bash
railway link
```

- Kies je **Railway-project**.
- Kies de **service waar je Next.js-app draait** (niet alleen de Postgres-database als losse service — tenzij daar je `DATABASE_URL` staat; meestal kies je de **web/glxy**-service).

### Database bijwerken (wanneer je wilt)

```bash
npm run db:push:railway
```

Dat is alles. Je ziet “Klaar” als het gelukt is.

---

## Methode B — Zonder Railway CLI (alleen plakken van een URL)

Handig als je CLI niet wilt installeren.

1. Ga in **Railway** naar je **Postgres**-service → tab **Variables**.
2. Kopieer **`DATABASE_PUBLIC_URL`** (om vanaf je eigen computer te verbinden).
3. Maak op je computer in de map `glxy` een bestand **`.env.railway`** met **precies deze inhoud** (plak jouw URL tussen de aanhalingstekens):

   ```bash
   DATABASE_URL="plak-hier-de-url-van-railway"
   ```

   Als de verbinding faalt: zet aan het **einde** van de URL nog `?sslmode=require` (of `&sslmode=require` als er al een `?` in de URL zit).

   Je kunt ook `railway.env.example` als voorbeeld openen en het bestand als `.env.railway` opslaan.

4. In Terminal, in de map `glxy`:

   ```bash
   npm run db:push:env
   ```

5. Optioneel: verwijder `.env.railway` daarna weer (staat toch in `.gitignore`, komt niet op GitHub).

---

## Hulp nodig?

- Foutmelding over **DATABASE_URL**: controleer of de URL volledig gekopieerd is en of `?sslmode=require` nodig is.
- Foutmelding **can't reach database**: dan bereikt je Mac de server niet — check internet, firewall, of gebruik Methode A met `railway run` (die gebruikt Railway’s netwerk).

Meer technische details staan in **`RAILWAY.md`** in de root van het project.
