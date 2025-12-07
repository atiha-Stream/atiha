# Guide de Vérification du Déploiement Vercel

## ✅ Étape 1 : Code poussé sur Git

**Status : ✅ TERMINÉ**

- Tous les fichiers sont commités
- Code poussé sur `origin/main`
- Dernier commit : `099d338 - feat: Ajout script pour créer utilisateur et admin initiaux en production`

---

## 📋 Étape 2 : Vérifier que Vercel détecte le push

### Actions à faire :

1. **Aller sur Vercel Dashboard**
   - URL : https://vercel.com
   - Se connecter à votre compte

2. **Sélectionner le projet `atiha`**
   - Cliquer sur le projet depuis le dashboard

3. **Vérifier les déploiements**
   - Aller dans l'onglet **"Deployments"**
   - Vous devriez voir un nouveau déploiement en cours ou récent
   - Le déploiement devrait avoir le commit `099d338` ou plus récent

4. **Vérifier le statut**
   - Si le déploiement est en cours : Status = "Building" ou "Deploying"
   - Si le déploiement est terminé : Status = "Ready" (vert) ou "Error" (rouge)

**✅ Si vous voyez un nouveau déploiement : Vercel a bien détecté le push**

---

## 🔨 Étape 3 : Vérifier que le build passe sur Vercel

### Actions à faire :

1. **Cliquer sur le déploiement en cours/récent**
   - Cela ouvre les détails du déploiement

2. **Vérifier les logs de build**
   - Cliquer sur **"Build Logs"** ou **"View Function Logs"**
   - Scroller pour voir toutes les étapes du build

3. **Étapes attendues dans les logs :**

   ```
   ✓ Installing dependencies
   ✓ Running "prisma generate" (postinstall)
   ✓ Running "prisma migrate deploy"
   ✓ Running "prisma generate"
   ✓ Running "next build"
   ✓ Build completed
   ```

4. **Vérifier les erreurs**
   - Si vous voyez des erreurs en rouge, notez-les
   - Erreurs courantes :
     - `Cannot find module` → Dépendances manquantes
     - `DATABASE_URL is not defined` → Variable d'environnement manquante
     - `Prisma migration failed` → Problème de connexion à la base de données

**✅ Si le build se termine avec "Build completed" : Le build passe**

---

## 🔍 Étape 4 : Vérifier les logs pour confirmer que Prisma se connecte

### Actions à faire :

1. **Dans les logs de build, chercher :**

   **✅ Signes de succès :**
   ```
   Prisma schema loaded from prisma/schema.prisma
   Datasource "db": PostgreSQL database "postgres", schema "public" at "db.prisma.io:5432"
   Applying migration `20251206013111_baseline`
   Migration applied successfully
   Generated Prisma Client
   ```

   **❌ Signes d'erreur :**
   ```
   Error: P1001: Can't reach database server
   Error: P1000: Authentication failed
   Error: Invalid `prisma.migrate.deploy()` invocation
   ```

2. **Vérifier les variables d'environnement**
   - Aller dans **Settings** → **Environment Variables**
   - Vérifier que ces variables sont définies :
     - ✅ `DATABASE_URL`
     - ✅ `POSTGRES_URL`
     - ✅ `PRISMA_DATABASE_URL` (optionnel)
     - ✅ `REDIS_URL` (optionnel)

3. **Vérifier les logs runtime (après le build)**
   - Aller dans **"Functions"** ou **"Logs"**
   - Tester une route API : `/api/homepage-editor`
   - Vérifier qu'il n'y a pas d'erreur de connexion Prisma

**✅ Si vous voyez "Migration applied successfully" : Prisma se connecte correctement**

---

## 🚨 Dépannage

### Si le build échoue :

1. **Erreur : "Cannot find module"**
   - Vérifier que toutes les dépendances sont dans `dependencies` (pas `devDependencies`)
   - Relancer le build

2. **Erreur : "DATABASE_URL is not defined"**
   - Aller dans **Settings** → **Environment Variables**
   - Ajouter `DATABASE_URL` avec la valeur de production
   - Redéployer

3. **Erreur : "Prisma migration failed"**
   - Vérifier que `DATABASE_URL` est correcte
   - Vérifier que la base de données est accessible depuis Vercel
   - Vérifier les logs pour l'erreur exacte

4. **Erreur : "Build timeout"**
   - Le build prend trop de temps
   - Vérifier les logs pour voir où ça bloque
   - Peut-être réduire les migrations ou optimiser le build

---

## ✅ Checklist finale

- [ ] Vercel détecte le push (nouveau déploiement visible)
- [ ] Le build passe sans erreur
- [ ] Les migrations Prisma sont appliquées
- [ ] Le client Prisma est généré
- [ ] L'application est déployée et accessible
- [ ] Les routes API fonctionnent (tester `/api/homepage-editor`)

---

## 📝 Notes

- Le build utilise `prisma migrate deploy` qui nécessite une connexion à la base de données
- Les variables d'environnement doivent être configurées AVANT le build
- Si vous modifiez les variables d'environnement, il faut redéployer

---

## 🔗 Liens utiles

- Dashboard Vercel : https://vercel.com/dashboard
- Documentation Vercel : https://vercel.com/docs
- Documentation Prisma : https://www.prisma.io/docs

