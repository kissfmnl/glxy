#!/usr/bin/env bash
# Probeert prisma db push via `railway run` (zelfde env als gekoppelde service).
# Let op: werkt meestal NIET vanaf je Mac als DATABASE_URL intern is (postgres.railway.internal).
# Gebruik dan: DATABASE_PUBLIC_URL in .env.railway → npm run db:push:env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v railway >/dev/null 2>&1; then
  echo ""
  echo "❌ Het programma 'railway' staat nog niet op je Mac."
  echo ""
  echo "   Installeer de Railway CLI (eenmalig):"
  echo "     brew install railway"
  echo ""
  echo "   Werkt db push vanaf je laptop:"
  echo "     Kopieer DATABASE_PUBLIC_URL uit Railway → Postgres → Variables"
  echo "     naar bestand .env.railway als DATABASE_URL=..."
  echo "     npm run db:push:env"
  echo ""
  exit 1
fi

echo ""
echo "→ Probeer prisma db push via railway run..."
echo "  (Faalt dit met postgres.railway.internal? Gebruik npm run db:push:env + .env.railway — zie docs/START-HIER-RAILWAY.md)"
echo ""

set +e
railway run npx prisma db push
EXIT=$?
set -e

if [ "$EXIT" -ne 0 ]; then
  echo ""
  echo "❌ Mislukt (vaak P1001 vanaf je Mac)."
  echo ""
  echo "   Dit is normaal: je service gebruikt een interne database-host die alleen"
  echo "   op Railway zelf werkt, niet vanaf je laptop."
  echo ""
  echo "   Zo los je het op:"
  echo "   1. Railway → Postgres → Variables → kopieer DATABASE_PUBLIC_URL"
  echo "   2. Maak .env.railway met:  DATABASE_URL=\"...\"  (+ ?sslmode=require aan het eind)"
  echo "   3. npm run db:push:env"
  echo ""
  echo "   Uitleg: docs/START-HIER-RAILWAY.md"
  echo ""
  exit "$EXIT"
fi

echo ""
echo "✓ Klaar. Tabellen op Railway zijn bijgewerkt."
echo ""
