# 🔍 Guide : Vérifier les Variables d'Environnement sur Vercel

## ⚠️ Problème Actuel

Le build échoue avec l'erreur :
```
Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

Cela signifie que **`DATABASE_URL` n'est pas définie** dans Vercel au moment du build.

---

## ✅ Solution : Vérifier et Ajouter les Variables

### Étape 1 : Accéder aux Variables d'Environnement

1. **Aller sur Vercel Dashboard**
   - URL : https://vercel.com/dashboard
   - Se connecter à votre compte

2. **Sélectionner le Projet**
   - Cliquer sur le projet **`atiha`**

3. **Ouvrir les Paramètres**
   - Cliquer sur **"Settings"** dans le menu de gauche
   - Cliquer sur **"Environment Variables"** dans le sous-menu

---

### Étape 2 : Vérifier les Variables Existantes

Vérifiez si ces variables existent :

- ✅ `DATABASE_URL`
- ✅ `POSTGRES_URL`
- ✅ `PRISMA_DATABASE_URL`

**Si elles n'existent PAS ou sont vides**, passez à l'Étape 3.

---

### Étape 3 : Ajouter les Variables (si manquantes)

Pour **chaque variable manquante**, suivez ces étapes :

1. **Cliquer sur "Add New"**
2. **Remplir les champs :**
   - **Key** : Le nom de la variable (ex: `DATABASE_URL`)
   - **Value** : La valeur (voir ci-dessous)
   - **Environments** : ✅ Cocher **Production**, **Preview**, et **Development**

3. **Cliquer sur "Save"**

---

### 📋 Variables à Ajouter

#### 1. `DATABASE_URL` (OBLIGATOIRE)

**Value :**
```
postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require
```

**Environments :** ✅ Production, ✅ Preview, ✅ Development

---

#### 2. `POSTGRES_URL` (OBLIGATOIRE)

**Value :**
```
postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require
```

**Environments :** ✅ Production, ✅ Preview, ✅ Development

---

#### 3. `PRISMA_DATABASE_URL` (RECOMMANDÉ)

**Value :**
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18tblljeHlydE9EUkRXNkh3a1lsRmMiLCJhcGlfa2V5IjoiMDFLQlRWMU4wS0hXN1NFTTVCSlpURzExS1kiLCJ0ZW5hbnRfaWQiOiJkZjE1NDkxOGI4YjZmYmEyM2VhM2M3NjAyNTk4NTM4MDcyMzQzOGRlMGM5ZDJhN2M0NzkwMTU3YTdhOTMzZjE1IiwiaW50ZXJuYWxfc2VjcmV0IjoiOGI4YWY5YzctMjMyNC00ZjZjLWI0NTEtOWQ4YjVjYzczNTcwIn0.rooqcBdWnRsHiKDL5B4zqPdbYDAlVpp13FInA2mL9lU
```

**Environments :** ✅ Production, ✅ Preview, ✅ Development

**Note :** Cette variable utilise Prisma Accelerate (connection pooling). Elle n'est pas utilisée pour `DATABASE_URL` car elle commence par `prisma+postgres://`.

---

### Étape 4 : Autres Variables (si pas encore ajoutées)

#### `ADMIN_USERNAME`
```
leGenny
```

#### `ADMIN_PASSWORD`
```
Atiasekbaby@89#2025!
```

#### `ADMIN_SECURITY_CODE`
```
101089555@ABC
```

#### `NEXT_PUBLIC_APP_URL`
```
https://atiha.vercel.app
```

#### `NEXT_PUBLIC_APP_NAME`
```
atiha
```

#### `NODE_ENV`
```
production
```

#### `REDIS_URL` (optionnel)
```
redis://...
```

---

### Étape 5 : Redéployer

Après avoir ajouté/modifié les variables :

1. **Aller sur l'onglet "Deployments"**
2. **Cliquer sur le menu "..."** du dernier déploiement
3. **Cliquer sur "Redeploy"**
4. **Vérifier les logs de build**

---

## 🔍 Vérification

Après le redéploiement, vérifiez les logs de build. Vous devriez voir :

```
✅ DATABASE_URL configurée depuis POSTGRES_URL
```

ou

```
✅ DATABASE_URL est configurée et valide
```

Si vous voyez toujours l'erreur `P1012`, cela signifie que les variables ne sont toujours pas accessibles. Dans ce cas :

1. Vérifiez que les variables sont bien sauvegardées (rafraîchissez la page)
2. Vérifiez que les variables sont activées pour **Production** (pas seulement Preview/Development)
3. Attendez quelques minutes et redéployez à nouveau

---

## ❓ Questions Fréquentes

**Q : Les variables `atiha_DATABASE_URL`, `atiha_POSTGRES_URL` sont-elles suffisantes ?**

R : Non. Vercel préfixe automatiquement les variables avec le nom du projet, mais Prisma lit directement `DATABASE_URL` depuis le schéma. Il faut donc ajouter explicitement `DATABASE_URL` dans Vercel.

**Q : Pourquoi le script `setup-db-env.js` ne fonctionne pas ?**

R : Le script fonctionne, mais il ne peut pas créer des variables qui n'existent pas. Si `POSTGRES_URL`, `PRISMA_DATABASE_URL`, et `atiha_*` ne sont pas définies, le script ne peut rien faire. Il faut donc ajouter au moins `DATABASE_URL` ou `POSTGRES_URL` directement dans Vercel.

