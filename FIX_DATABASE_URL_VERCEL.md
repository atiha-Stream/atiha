# 🔧 Fix : Erreur DATABASE_URL sur Vercel

## ❌ Erreur Actuelle

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

**Cause** : `DATABASE_URL` n'est pas définie dans Vercel au moment du build.

---

## ✅ Solution : Ajouter les Variables dans Vercel

### Étape 1 : Aller dans les Paramètres du Projet

1. **Aller sur Vercel Dashboard**
   - URL : https://vercel.com/dashboard
   - Se connecter à votre compte

2. **Sélectionner le Projet `atiha`**
   - Cliquer sur le projet depuis le dashboard

3. **Aller dans Settings → Environment Variables**
   - Cliquer sur **"Settings"** (en haut)
   - Cliquer sur **"Environment Variables"** (dans le menu de gauche)

---

### Étape 2 : Ajouter les Variables de Base de Données

**⚠️ IMPORTANT** : Ajoutez ces variables pour **TOUS** les environnements :
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

#### Variable 1 : `DATABASE_URL`

1. Cliquer sur **"Add New"** ou **"Add Another"**
2. **Key** : `DATABASE_URL`
3. **Value** :
   ```
   postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require
   ```
4. **Environments** : Cocher **Production**, **Preview**, et **Development**
5. Cliquer sur **"Save"**

#### Variable 2 : `POSTGRES_URL`

1. Cliquer sur **"Add New"** ou **"Add Another"**
2. **Key** : `POSTGRES_URL`
3. **Value** :
   ```
   postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require
   ```
4. **Environments** : Cocher **Production**, **Preview**, et **Development**
5. Cliquer sur **"Save"**

#### Variable 3 : `PRISMA_DATABASE_URL` (Recommandé)

1. Cliquer sur **"Add New"** ou **"Add Another"**
2. **Key** : `PRISMA_DATABASE_URL`
3. **Value** :
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18tblljeHlydE9EUkRXNkh3a1lsRmMiLCJhcGlfa2V5IjoiMDFLQlRWMU4wS0hXN1NFTTVCSlpURzExS1kiLCJ0ZW5hbnRfaWQiOiJkZjE1NDkxOGI4YjZmYmEyM2VhM2M3NjAyNTk4NTM4MDcyMzQzOGRlMGM5ZDJhN2M0NzkwMTU3YTdhOTMzZjE1IiwiaW50ZXJuYWxfc2VjcmV0IjoiOGI4YWY5YzctMjMyNC00ZjZjLWI0NTEtOWQ4YjVjYzczNTcwIn0.rooqcBdWnRsHiKDL5B4zqPdbYDAlVpp13FInA2mL9lU
   ```
4. **Environments** : Cocher **Production**, **Preview**, et **Development**
5. Cliquer sur **"Save"**

---

### Étape 3 : Vérifier que les Variables sont Ajoutées

Après avoir ajouté les variables, vous devriez voir dans la liste :

- ✅ `DATABASE_URL` (Production, Preview, Development)
- ✅ `POSTGRES_URL` (Production, Preview, Development)
- ✅ `PRISMA_DATABASE_URL` (Production, Preview, Development)

---

### Étape 4 : Redéployer le Projet

**⚠️ IMPORTANT** : Après avoir ajouté les variables, vous devez redéployer pour que les changements prennent effet.

#### Option A : Redéployer depuis le Dashboard

1. Aller dans **"Deployments"** (onglet en haut)
2. Cliquer sur les **3 points** (⋯) du dernier déploiement
3. Cliquer sur **"Redeploy"**
4. Vérifier que les variables sont bien chargées

#### Option B : Redéployer via un Nouveau Push

1. Faire un petit changement dans le code (ex: ajouter un commentaire)
2. Commit et push :
   ```bash
   git add .
   git commit -m "Trigger: Redéploiement avec variables d'environnement"
   git push origin main
   ```
3. Vercel détectera automatiquement le push et redéploiera

---

## ✅ Vérification

Après le redéploiement, vérifiez les logs de build. Vous devriez voir :

```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Migration applied successfully
✓ Generated Prisma Client
✓ Build completed
```

**Plus d'erreur** : `Error validating datasource 'db': the URL must start with...`

---

## 🚨 Points d'Attention

### 1. Vérifier les Environnements

Assurez-vous que les variables sont activées pour **TOUS** les environnements :
- ✅ Production
- ✅ Preview
- ✅ Development

Si une variable n'est activée que pour "Production", le build Preview échouera.

### 2. Vérifier le Format de l'URL

L'URL doit commencer par :
- `postgres://` ou
- `postgresql://`

**Ne pas utiliser** :
- ❌ `prisma+postgres://` pour `DATABASE_URL` (c'est pour `PRISMA_DATABASE_URL` uniquement)
- ❌ URL sans protocole
- ❌ URL avec des espaces

### 3. Vérifier les Caractères Spéciaux

Si votre mot de passe contient des caractères spéciaux (comme `@`, `#`, `!`), assurez-vous qu'ils sont correctement encodés dans l'URL.

---

## 📝 Checklist

- [ ] Aller dans Settings → Environment Variables
- [ ] Ajouter `DATABASE_URL` (Production, Preview, Development)
- [ ] Ajouter `POSTGRES_URL` (Production, Preview, Development)
- [ ] Ajouter `PRISMA_DATABASE_URL` (Production, Preview, Development)
- [ ] Vérifier que toutes les variables sont dans la liste
- [ ] Redéployer le projet
- [ ] Vérifier les logs de build (plus d'erreur P1012)

---

## 🎯 Résumé

**Le problème** : `DATABASE_URL` n'est pas définie dans Vercel au moment du build.

**La solution** : Ajouter `DATABASE_URL`, `POSTGRES_URL`, et `PRISMA_DATABASE_URL` dans Vercel → Settings → Environment Variables, pour tous les environnements, puis redéployer.

Une fois les variables ajoutées et le projet redéployé, le build devrait passer ! ✅

