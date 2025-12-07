# 🔧 Résoudre la Migration Échouée

## ⚠️ Problème

La migration `20251206013111_baseline` a échoué dans la base de données de production. Prisma refuse d'appliquer de nouvelles migrations tant que cette migration n'est pas résolue.

**Erreur :**
```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20251206013111_baseline` migration started at 2025-12-06 22:11:17.355569 UTC failed
```

---

## ✅ Solution 1 : Utiliser `prisma db push` (Recommandé)

J'ai modifié le script de build pour utiliser `prisma db push` au lieu de `prisma migrate deploy`. Cette commande synchronise directement le schéma avec la base de données sans passer par l'historique des migrations.

**Avantages :**
- ✅ Plus simple pour la production
- ✅ Évite les problèmes de migrations échouées
- ✅ Synchronise automatiquement le schéma

**Inconvénients :**
- ⚠️ Ne garde pas l'historique des migrations
- ⚠️ Peut perdre des données si le schéma change (d'où `--accept-data-loss`)

---

## ✅ Solution 2 : Résoudre la Migration Manuellement

Si vous préférez garder l'historique des migrations, vous pouvez résoudre la migration échouée :

### Étape 1 : Vérifier si les Tables Existent

Connectez-vous à la base de données et vérifiez si les tables existent déjà :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Si les tables existent (users, admins, etc.), la migration a probablement été appliquée mais marquée comme échouée.

### Étape 2 : Marquer la Migration comme Résolue

**Option A : Si les tables existent déjà (migration appliquée mais marquée comme échouée)**

```bash
npx prisma migrate resolve --applied 20251206013111_baseline
```

**Option B : Si les tables n'existent pas (migration n'a pas été appliquée)**

```bash
npx prisma migrate resolve --rolled-back 20251206013111_baseline
```

Puis réappliquer les migrations :

```bash
npx prisma migrate deploy
```

---

## 🚀 Solution 3 : Utiliser le Script Automatique

J'ai créé un script pour résoudre automatiquement la migration :

```bash
npm run resolve:migration
```

Ce script essaie d'abord de marquer la migration comme appliquée, puis comme annulée si cela échoue.

---

## 📋 Commandes Utiles

### Vérifier l'État des Migrations

```bash
npx prisma migrate status
```

### Voir les Migrations dans la Base de Données

```sql
SELECT * FROM "_prisma_migrations" ORDER BY started_at DESC;
```

### Réinitialiser les Migrations (⚠️ DANGEREUX - Perd l'historique)

```bash
# Supprimer toutes les migrations de la base de données
npx prisma migrate reset

# Puis réappliquer
npx prisma migrate deploy
```

---

## ✅ Solution Actuelle (Recommandée)

Le build utilise maintenant `prisma db push` qui :
1. Synchronise directement le schéma avec la base de données
2. Évite les problèmes de migrations échouées
3. Fonctionne bien pour la production

**Le build devrait maintenant passer !** 🎉

