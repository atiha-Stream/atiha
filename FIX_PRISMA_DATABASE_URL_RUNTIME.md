# 🔧 Fix : Erreur Prisma au Runtime

## ⚠️ Problème

L'erreur au runtime indique :
```
Error validating datasource `db`: the URL must start with the protocol `prisma://` or `prisma+postgres://`
```

Cela signifie que Prisma essaie d'utiliser `PRISMA_DATABASE_URL` (qui commence par `prisma+postgres://`) au lieu de `DATABASE_URL` (qui doit commencer par `postgres://`).

---

## 🔍 Cause

Le schéma Prisma utilise `env("DATABASE_URL")`, mais Prisma Client peut automatiquement utiliser `PRISMA_DATABASE_URL` si elle est définie, même si le schéma utilise `DATABASE_URL`.

---

## ✅ Solution 1 : Vérifier les Variables dans Vercel

1. **Aller sur Vercel Dashboard** → Projet `atiha` → **Settings** → **Environment Variables**

2. **Vérifier que `DATABASE_URL` est définie** avec une URL PostgreSQL standard :
   ```
   postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require
   ```

3. **Vérifier que `PRISMA_DATABASE_URL` est définie** avec l'URL Prisma Accelerate :
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=...
   ```

4. **Important** : Les deux variables doivent être définies, mais Prisma doit utiliser `DATABASE_URL` pour le schéma.

---

## ✅ Solution 2 : Modifier le Schéma Prisma (Alternative)

Si le problème persiste, on peut modifier le schéma pour utiliser explicitement `DATABASE_URL` et ignorer `PRISMA_DATABASE_URL` :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")  // Forcer l'utilisation de DATABASE_URL
}
```

**Note** : Cette solution nécessite Prisma 5.0+.

---

## ✅ Solution 3 : Supprimer PRISMA_DATABASE_URL (Temporaire)

Si vous n'utilisez pas Prisma Accelerate pour l'instant, vous pouvez temporairement supprimer `PRISMA_DATABASE_URL` de Vercel pour forcer Prisma à utiliser `DATABASE_URL`.

**⚠️ Attention** : Cela désactivera Prisma Accelerate (connection pooling), ce qui peut affecter les performances en production.

---

## ✅ Solution 4 : Utiliser Prisma Accelerate (Recommandé pour Production)

Si vous voulez utiliser Prisma Accelerate, modifiez le schéma pour utiliser `PRISMA_DATABASE_URL` :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("PRISMA_DATABASE_URL")
}
```

**Avantages** :
- ✅ Connection pooling automatique
- ✅ Meilleures performances
- ✅ Gestion automatique des connexions

**Inconvénients** :
- ⚠️ Nécessite un compte Prisma Data Platform
- ⚠️ Coût supplémentaire pour les grandes applications

---

## 🔍 Debug

Les logs devraient maintenant afficher :
```
[db-config] Variables disponibles: { ... }
[db-config] ✅ DATABASE_URL est configurée et valide
```

Si vous ne voyez pas ces logs, cela signifie que `db-config.ts` ne s'exécute pas correctement.

---

## 📋 Checklist

- [ ] `DATABASE_URL` est définie dans Vercel avec une URL `postgres://...`
- [ ] `POSTGRES_URL` est définie dans Vercel (identique à `DATABASE_URL`)
- [ ] `PRISMA_DATABASE_URL` est définie (optionnel, pour Accelerate)
- [ ] Les variables sont activées pour **Production**, **Preview**, et **Development**
- [ ] Le projet a été redéployé après avoir ajouté/modifié les variables

---

## 🚀 Prochaines Étapes

1. Vérifiez les logs de build pour voir si `DATABASE_URL` est bien configurée
2. Vérifiez les logs runtime pour voir les messages de `[db-config]`
3. Si le problème persiste, essayez Solution 3 (supprimer temporairement `PRISMA_DATABASE_URL`)

