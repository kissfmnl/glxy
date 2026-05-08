# Start hier: Railway-database bijwerken

Je hoeft niet te weten wat Prisma of `db push` precies doet. Je wilt alleen dat de **database op Railway** dezelfde tabellen heeft als je code.

---

## Wat het vaak al automatisch doet

Elke keer als Railway je site **opnieuw bouwt en start**, draait het script `npm start` al **`prisma db push`** vóór de site online gaat.  
**Na een gewone deploy hoef je dus vaak niets handmatig te doen.**

---

## Belangrijk: twee soorten database-URL op Railway

| Variabele | Waar voor |
|-----------|-----------|
| **`DATABASE_URL`** (intern: `postgres.railway.internal`) | Alleen **binnen Railway** (je draaiende website). Werkt **niet** vanaf je Mac. |
| **`DATABASE_PUBLIC_URL`** | Om **vanaf je eigen computer** te verbinden (Terminal op je Mac). |

Als je een fout krijgt zoals **Can't reach database server at `postgres.railway.internal`**, dan probeerde je met de **interne** URL te verbinden vanaf je Mac. Gebruik dan hieronder **Methode A** (publieke URL).

---

## Methode A — Vanaf je Mac (aanbevolen): publieke URL

Dit werkt altijd vanaf je laptop.

1. Ga in **Railway** naar je **Postgres**-service (niet je glxy-web-service).
2. Open het tabblad **Variables**.
3. Zoek **`DATABASE_PUBLIC_URL`** en kopieer de **volledige** waarde.
4. Maak op je computer in de map `glxy` een bestand **`.env.railway`** met precies deze inhoud (plak jouw URL tussen de aanhalingstekens):

   ```bash
   DATABASE_URL="plak-hier-DATABASE_PUBLIC_URL"
   ```

   **SSL:** staat er nog geen `?` in de URL, voeg aan het **einde** toe: `?sslmode=require`  
   Staat er al een `?` in de URL, voeg toe: `&sslmode=require`

5. In Terminal:

   ```bash
   cd /pad/naar/glxy
   npm install
   npm run db:push:env
   ```

6. Je zou iets als “Your database is now in sync” moeten zien.

7. Optioneel: verwijder `.env.railway` daarna weer (staat in `.gitignore`, komt niet op GitHub).

Zie ook **`railway.env.example`** in de projectmap.

---

## Methode B — `railway run` (werkt meestal níét vanaf je Mac)

```bash
npm run db:push:railway
```

Dit gebruikt `DATABASE_URL` van je **gekoppelde service**. Die is bijna altijd de **interne** URL (`postgres.railway.internal`). Vanaf je Mac kan je computer die hostnaam niet bereiken → **fout P1001**.

**Conclusie:** gebruik voor handmatig bijwerken vanaf huis **Methode A** met **`DATABASE_PUBLIC_URL`**.

---

## Waarom dit zo is (kort)

Je live site draait **op Railway’s servers** — daar mag `DATABASE_PUBLIC_URL` niet nodig zijn; daar gebruikt Railway het **interne** netwerk (`postgres.railway.internal`).  
Jouw Mac staat **daarbuiten**, daarom heb je de **publieke** connection string nodig.

---

## Hulp nodig?

- **P1001 / can't reach postgres.railway.internal** → Methode A met `DATABASE_PUBLIC_URL` in `.env.railway`.
- **SSL-fout** → voeg `?sslmode=require` of `&sslmode=require` toe aan de URL.
- Meer technische details: **`RAILWAY.md`** in de root van het project.
