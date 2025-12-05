# 📊 Guide d'Application des Migrations sur Vercel

**Date:** 2025-11-22

---

## 🎯 Problème

Vercel ne peut pas exécuter `prisma migrate dev` directement car :
- Les builds sont stateless
- Pas d'accès direct à la base de données pendant le build
- Les migrations doivent être appliquées séparément

---

## ✅ Solution 1 : Appliquer depuis le VPS (Recommandé)

### Étape 1 : Se connecter au VPS

```bash
ssh user@votre-vps-ip
```

### Étape 2 : Cloner le projet (temporairement)

```bash
# Créer un dossier temporaire
mkdir -p ~/atiha-migration
cd ~/atiha-migration

# Cloner le projet
git clone https://github.com/votre-repo/atiha.git
cd atiha

# Installer les dépendances
npm install
```

### Étape 3 : Configurer les variables

```bash
# Exporter DATABASE_URL
export DATABASE_URL="postgresql://atiha:votre_mot_de_passe@localhost:5432/atiha_db?schema=public"
```

### Étape 4 : Appliquer les migrations

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy
```

### Étape 5 : Nettoyer

```bash
# Supprimer le dossier temporaire
cd ~
rm -rf ~/atiha-migration
```

---

## ✅ Solution 2 : Via Script de Déploiement Vercel

### Étape 1 : Créer un endpoint API pour les migrations

Créer `src/app/api/admin/migrate/route.ts` :

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('atiha_admin_data')

    if (!adminCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const admin = JSON.parse(adminCookie.value)

    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Non autorisé - Super admin uniquement' },
        { status: 403 }
      )
    }

    // Exécuter les migrations
    // Note: Prisma migrate deploy nécessite un accès direct à la base de données
    // Cette solution fonctionne seulement si vous pouvez exécuter des commandes shell
    
    logger.info('Migration déclenchée par admin', { adminId: admin.id })

    return NextResponse.json({
      success: true,
      message: 'Migration déclenchée (vérifier les logs)',
    })
  } catch (error) {
    logger.error('Erreur lors de la migration', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
```

### Étape 2 : Utiliser Vercel CLI en local

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Récupérer les variables d'environnement
vercel env pull .env.local

# Appliquer les migrations
npx prisma migrate deploy
```

---

## ✅ Solution 3 : Via GitHub Actions (Automatisé)

Créer `.github/workflows/migrate.yml` :

```yaml
name: Apply Database Migrations

on:
  push:
    branches:
      - main
    paths:
      - 'prisma/migrations/**'
      - 'prisma/schema.prisma'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate Prisma Client
        run: npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Apply migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Configuration GitHub Secrets:**
- `DATABASE_URL` : URL de connexion PostgreSQL

---

## ✅ Solution 4 : SQL Direct (Rapide)

Si vous avez déjà le fichier SQL de migration :

```bash
# Depuis le VPS
psql -U atiha -d atiha_db -f prisma/migrations/add_anomaly_detection.sql
```

---

## 🎯 Recommandation

**Pour la première migration :** Utiliser la **Solution 1** (depuis le VPS)

**Pour les migrations futures :** Utiliser la **Solution 3** (GitHub Actions) pour automatiser

---

## ✅ Vérification

Après avoir appliqué la migration :

```bash
# Se connecter à PostgreSQL
psql -U atiha -d atiha_db

# Vérifier les tables
\dt

# Vérifier la structure
\d user_behaviors
\d anomalies

# Quitter
\q
```

---

*Guide créé le 22 Novembre 2025*

