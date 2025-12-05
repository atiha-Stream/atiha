#!/bin/bash
# Script pour appliquer les migrations Prisma
# À exécuter après le déploiement sur Vercel

echo "🔧 Application des migrations Prisma..."

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

echo "✅ Migrations appliquées avec succès"

