#!/usr/bin/env bash
# Voert prisma db push uit in Railway-omgeving (zelfde DATABASE_URL als je live site).
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
  echo "   Of zie: https://docs.railway.com/develop/cli"
  echo ""
  echo "   Alternatief zonder CLI: kopieer DATABASE_URL naar .env.railway en run:"
  echo "     npm run db:push:env"
  echo ""
  exit 1
fi

echo ""
echo "→ Database-schema bijwerken op Railway (prisma db push)..."
echo "  Tip: dit gebruikt de omgeving van je gekoppelde Railway-service."
echo ""

railway run npx prisma db push

echo ""
echo "✓ Klaar. Tabellen op Railway zijn bijgewerkt."
echo ""
