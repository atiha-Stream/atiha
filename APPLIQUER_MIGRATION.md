# 📋 Appliquer la Migration - Détection d'Anomalies

**Date:** 2025-11-22

---

## ✅ Étape 1 : Migration Créée

La migration SQL a été créée manuellement dans :
- `prisma/migrations/add_anomaly_detection.sql`
- `prisma/migrations/add_anomaly_detection/migration.sql`

---

## 🚀 Étape 2 : Démarrer PostgreSQL

### Option A : Docker (Recommandé)

```bash
# Démarrer PostgreSQL
docker-compose up -d postgres

# Vérifier qu'il est démarré
docker ps
```

### Option B : PostgreSQL Local

Assurez-vous que PostgreSQL est installé et démarré sur votre machine.

---

## 🔧 Étape 3 : Configurer DATABASE_URL

### Dans .env.local

Ajoutez ou vérifiez que cette ligne existe :

```env
DATABASE_URL=postgresql://atiha:atiha_secure_password_change_in_production@localhost:5432/atiha_db?schema=public
```

**Note:** Si vous utilisez une base de données différente, ajustez l'URL en conséquence.

---

## 📊 Étape 4 : Appliquer la Migration

### Méthode 1 : Via Prisma (Recommandé)

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://atiha:atiha_secure_password_change_in_production@localhost:5432/atiha_db?schema=public"
npx prisma migrate deploy
```

Ou si vous préférez utiliser le fichier .env.local :

```bash
# Créer un fichier .env (Prisma lit .env par défaut)
Copy-Item .env.local .env

# Appliquer la migration
npx prisma migrate deploy
```

### Méthode 2 : SQL Direct

Si Prisma ne fonctionne pas, vous pouvez exécuter le SQL directement :

```bash
# Avec psql
psql -U atiha -d atiha_db -f prisma/migrations/add_anomaly_detection.sql

# Ou via Docker
docker exec -i atiha_postgres psql -U atiha -d atiha_db < prisma/migrations/add_anomaly_detection.sql
```

---

## ✅ Étape 5 : Vérifier

### Vérifier que les tables existent

```bash
# Ouvrir Prisma Studio
npx prisma studio
```

Vous devriez voir :
- ✅ `user_behaviors` - Table pour stocker les comportements utilisateur
- ✅ `anomalies` - Table pour stocker les anomalies détectées

### Vérifier via SQL

```sql
-- Se connecter à PostgreSQL
psql -U atiha -d atiha_db

-- Lister les tables
\dt

-- Vérifier la structure
\d user_behaviors
\d anomalies
```

---

## 🎯 Prochaines Étapes

Une fois la migration appliquée :

1. ✅ Les tables sont créées
2. ✅ Le service `anomaly-detection.ts` peut maintenant sauvegarder les données
3. ✅ Les hooks trackent automatiquement les actions
4. ✅ L'interface admin peut afficher les anomalies

---

## ⚠️ Dépannage

### Erreur : "Can't reach database server"

**Solution:** Vérifiez que PostgreSQL est démarré :
```bash
docker ps  # Vérifier que le conteneur est en cours d'exécution
```

### Erreur : "database does not exist"

**Solution:** Créez la base de données :
```sql
CREATE DATABASE atiha_db;
```

### Erreur : "role does not exist"

**Solution:** Créez l'utilisateur :
```sql
CREATE USER atiha WITH PASSWORD 'atiha_secure_password_change_in_production';
GRANT ALL PRIVILEGES ON DATABASE atiha_db TO atiha;
```

---

*Guide créé le 22 Novembre 2025*

