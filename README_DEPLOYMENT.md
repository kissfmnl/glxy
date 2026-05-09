# GLXY — Deploy-notities

De **volledige workflow** (Git push → Railway → live site) staat in **[README.md](./README.md)**.

Technische Railway-checklist en omgevingsvariabelen: **[RAILWAY.md](./RAILWAY.md)**.

- **Build:** `npm run build` (`prisma generate` + `next build`).
- **Start (productie):** `npm start` (`prisma db push`, `prisma db seed`, `next start`).
- **Database:** alleen via `DATABASE_URL` in Railway — geen hardcoded URLs in de repo.
