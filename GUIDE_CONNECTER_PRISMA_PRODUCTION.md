# Guide : Connecter Prisma à la base de données de production

## Problème

La base de données en production n'est pas connectée à Prisma. Les tables n'existent peut-être pas ou Prisma ne peut pas se connecter.

## Solution : Script de correction automatique

### Étape 1 : Exécuter le script de correction

```bash
npm run fix:prisma:production
```

Ce script va :
1. ✅ Configurer `DATABASE_URL` avec l'URL de production
2. ✅ Tester la connexion à la base de données
3. ✅ Vérifier les tables existantes
4. ✅ Appliquer le schéma Prisma si des tables manquent (`prisma db push`)
5. ✅ Générer le client Prisma
6. ✅ Vérifier les utilisateurs et admins

### Étape 2 : Vérifier les variables d'environnement sur Vercel

1. **Aller sur Vercel → Votre projet → Settings → Environment Variables**

2. **Vérifier que ces variables sont définies :**
   - ✅ `DATABASE_URL` = `postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require`
   - ✅ `POSTGRES_URL` = (même valeur que DATABASE_URL)
   - ❌ `PRISMA_DATABASE_URL` = **SUPPRIMER** si elle existe (ou laisser vide)

3. **Si PRISMA_DATABASE_URL existe et commence par `prisma+postgres://` :**
   - **LA SUPPRIMER** complètement
   - Elle interfère avec la connexion Prisma

### Étape 3 : Créer les utilisateurs et admins

Après avoir corrigé la connexion, créer les utilisateurs :

```bash
npm run create:initial-users:production
```

### Étape 4 : Redéployer sur Vercel

1. **Aller sur Vercel → Votre projet → Deployments**
2. **Cliquer sur "Redeploy"** ou attendre le déploiement automatique après un push Git

## Vérification manuelle

### Option 1 : Via Prisma Studio

```bash
npm run db:studio:production
```

Vérifier que :
- Les tables `users`, `admins`, `homepage_editor` existent
- Les données sont visibles

### Option 2 : Via script de test

```bash
npm run test:login
```

## Si le problème persiste

### Vérifier les logs Vercel

1. Aller sur Vercel → Votre projet → Logs
2. Tenter une connexion
3. Vérifier les erreurs dans les logs

### Erreurs communes

1. **"Can't reach database server"**
   - Vérifier que `DATABASE_URL` est correcte sur Vercel
   - Vérifier que la base de données Prisma est active

2. **"Invalid prisma.homepageEditor.findFirst() invocation"**
   - La table `homepage_editor` n'existe pas
   - Exécuter `npm run fix:prisma:production`

3. **"Error validating datasource db: the URL must start with prisma://"**
   - `PRISMA_DATABASE_URL` est définie et interfère
   - La supprimer de Vercel

## Commandes utiles

```bash
# Corriger la connexion Prisma
npm run fix:prisma:production

# Créer les utilisateurs/admins
npm run create:initial-users:production

# Tester la connexion
npm run test:login

# Ouvrir Prisma Studio
npm run db:studio:production
```

