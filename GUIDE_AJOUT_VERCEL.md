# 🚀 Guide : Ajouter le Projet sur Vercel

## ✅ Réponse : OUI, avec les variables d'environnement

**Recommandation :** Ajoutez les variables d'environnement **AVANT** le premier build, car le build exécute `prisma migrate deploy` qui nécessite `DATABASE_URL`.

---

## 📋 Étapes pour Ajouter le Projet sur Vercel

### Étape 1 : Connecter le Repository GitHub

1. **Aller sur Vercel Dashboard**
   - URL : https://vercel.com
   - Se connecter à votre compte

2. **Ajouter un Nouveau Projet**
   - Cliquer sur **"Add New..."** → **"Project"**
   - Ou aller sur https://vercel.com/new

3. **Importer le Repository**
   - Sélectionner **GitHub**
   - Autoriser Vercel à accéder à votre compte GitHub (si nécessaire)
   - Chercher et sélectionner le repository : `atiha-Stream/atiha`
   - Cliquer sur **"Import"**

---

### Étape 2 : Configuration du Projet (IMPORTANT : NE PAS CLIQUEZ SUR DEPLOY ENCORE)

1. **Vérifier les Paramètres de Build**
   - **Framework Preset** : Next.js (devrait être détecté automatiquement)
   - **Root Directory** : `./` (racine du projet)
   - **Build Command** : `npm run build` (déjà configuré dans `vercel.json`)
   - **Output Directory** : `.next` (par défaut pour Next.js)
   - **Install Command** : `npm install` (par défaut)

2. **⚠️ NE PAS CLIQUEZ SUR "Deploy" ENCORE**
   - On va d'abord ajouter les variables d'environnement

---

### Étape 3 : Ajouter les Variables d'Environnement (AVANT LE BUILD)

1. **Avant de cliquer sur "Deploy"**, cliquez sur **"Environment Variables"** ou **"Configure"**

2. **Ajouter les Variables OBLIGATOIRES suivantes :**

#### ✅ Variables de Base de Données (OBLIGATOIRES)

**`DATABASE_URL`**
```
postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require
```
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Description** : URL de connexion PostgreSQL pour Prisma

**`POSTGRES_URL`**
```
postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require
```
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Description** : URL PostgreSQL (identique à DATABASE_URL)

**`PRISMA_DATABASE_URL`**
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18tblljeHlydE9EUkRXNkh3a1lsRmMiLCJhcGlfa2V5IjoiMDFLQlRWMU4wS0hXN1NFTTVCSlpURzExS1kiLCJ0ZW5hbnRfaWQiOiJkZjE1NDkxOGI4YjZmYmEyM2VhM2M3NjAyNTk4NTM4MDcyMzQzOGRlMGM5ZDJhN2M0NzkwMTU3YTdhOTMzZjE1IiwiaW50ZXJuYWxfc2VjcmV0IjoiOGI4YWY5YzctMjMyNC00ZjZjLWI0NTEtOWQ4YjVjYzczNTcwIn0.rooqcBdWnRsHiKDL5B4zqPdbYDAlVpp13FInA2mL9lU
```
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Description** : URL Prisma avec Accelerate (connection pooling)

#### ✅ Variables Recommandées

**`REDIS_URL`** (Optionnel mais recommandé)
```
redis://localhost:6379
```
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Description** : URL Redis pour le cache et rate limiting
- **Note** : Si vous n'avez pas Redis, vous pouvez laisser vide ou utiliser une URL Redis cloud

**`NODE_ENV`**
```
production
```
- **Environnements** : ✅ Production uniquement
- **Description** : Environnement d'exécution

**`NEXT_PUBLIC_APP_URL`**
```
https://atiha.vercel.app
```
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Description** : URL publique de l'application (sera remplacée par votre domaine Vercel)

3. **Pour chaque variable :**
   - Cliquer sur **"Add"** ou **"Add Another"**
   - Entrer le **Nom** de la variable
   - Entrer la **Valeur** de la variable
   - Sélectionner les **Environnements** (Production, Preview, Development)
   - Cliquer sur **"Save"**

---

### Étape 4 : Déployer le Projet

1. **Après avoir ajouté toutes les variables**, revenir à la page de configuration

2. **Cliquer sur "Deploy"**
   - Vercel va maintenant :
     - Cloner le repository
     - Installer les dépendances (`npm install`)
     - Exécuter `prisma generate` (postinstall)
     - Exécuter `prisma migrate deploy` (dans le build)
     - Exécuter `prisma generate` (dans le build)
     - Exécuter `next build`
     - Déployer l'application

3. **Surveiller le Build**
   - Vous verrez les logs en temps réel
   - Le build peut prendre 2-5 minutes

---

### Étape 5 : Vérifier le Déploiement

1. **Vérifier les Logs de Build**
   - Chercher ces messages de succès :
     ```
     ✓ Prisma schema loaded
     ✓ Migration applied successfully
     ✓ Generated Prisma Client
     ✓ Build completed
     ```

2. **Vérifier les Erreurs**
   - Si vous voyez des erreurs, notez-les
   - Erreurs courantes :
     - `DATABASE_URL is not defined` → Variable manquante
     - `Can't reach database server` → Problème de connexion
     - `Cannot find module` → Dépendance manquante

3. **Tester l'Application**
   - Une fois le build terminé, Vercel vous donnera une URL
   - Tester : `https://votre-projet.vercel.app`
   - Tester l'API : `https://votre-projet.vercel.app/api/homepage-editor`

---

## 🔧 Ajouter des Variables Après le Déploiement

Si vous avez oublié une variable ou si vous devez en ajouter une après :

1. **Aller dans Settings → Environment Variables**
2. **Ajouter la variable**
3. **Redéployer** :
   - Aller dans **Deployments**
   - Cliquer sur les **3 points** (⋯) du dernier déploiement
   - Cliquer sur **"Redeploy"**

---

## ✅ Checklist Avant de Déployer

- [ ] Repository GitHub connecté
- [ ] Variables `DATABASE_URL` ajoutée
- [ ] Variables `POSTGRES_URL` ajoutée
- [ ] Variables `PRISMA_DATABASE_URL` ajoutée (optionnel mais recommandé)
- [ ] Variables `REDIS_URL` ajoutée (optionnel)
- [ ] Variables configurées pour tous les environnements (Production, Preview, Development)
- [ ] Prêt à cliquer sur "Deploy"

---

## 🚨 Dépannage

### Si le build échoue avec "DATABASE_URL is not defined"
- Vérifier que la variable est bien ajoutée dans Vercel
- Vérifier qu'elle est activée pour l'environnement "Production"
- Redéployer après avoir ajouté la variable

### Si le build échoue avec "Can't reach database server"
- Vérifier que l'URL de la base de données est correcte
- Vérifier que la base de données est accessible depuis Vercel
- Vérifier les credentials dans l'URL

### Si le build échoue avec "Cannot find module"
- Vérifier que toutes les dépendances sont dans `dependencies` (pas `devDependencies`)
- Vérifier les logs pour voir quel module manque

---

## 📝 Notes Importantes

1. **Variables d'environnement** : Il est **fortement recommandé** d'ajouter les variables AVANT le premier build, car le build nécessite `DATABASE_URL` pour les migrations Prisma.

2. **Sécurité** : Ne jamais commiter les variables d'environnement dans Git. Utilisez toujours les variables d'environnement de Vercel.

3. **Redéploiement** : Si vous modifiez les variables d'environnement, vous devez redéployer pour que les changements prennent effet.

4. **Environnements** : Configurez les variables pour tous les environnements (Production, Preview, Development) pour éviter les problèmes.

---

## 🎉 C'est Prêt !

Une fois toutes les variables ajoutées, vous pouvez cliquer sur **"Deploy"** et Vercel va déployer votre application avec toutes les configurations nécessaires.

