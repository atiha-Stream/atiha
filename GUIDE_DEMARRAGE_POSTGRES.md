# 🐘 Guide de Démarrage PostgreSQL pour les Migrations

**Date:** 2025-11-22

---

## 📋 Situation Actuelle

La migration Prisma a été créée mais PostgreSQL n'est pas démarré. Vous devez démarrer PostgreSQL avant d'appliquer la migration.

---

## 🚀 Option 1 : Docker (Recommandé)

### Démarrer PostgreSQL avec Docker

```bash
# Démarrer uniquement PostgreSQL
docker-compose up -d postgres

# Vérifier que PostgreSQL est démarré
docker ps

# Voir les logs
docker-compose logs postgres
```

### Appliquer la Migration

Une fois PostgreSQL démarré :

```bash
# Définir la variable d'environnement (Windows PowerShell)
$env:DATABASE_URL="postgresql://atiha:atiha_secure_password_change_in_production@localhost:5432/atiha_db?schema=public"

# Appliquer la migration
npx prisma migrate dev
```

---

## 🚀 Option 2 : PostgreSQL Local

Si vous avez PostgreSQL installé localement :

### 1. Créer la Base de Données

```sql
CREATE DATABASE atiha_db;
CREATE USER atiha WITH PASSWORD 'atiha_secure_password_change_in_production';
GRANT ALL PRIVILEGES ON DATABASE atiha_db TO atiha;
```

### 2. Configurer .env.local

Ajouter dans `.env.local` :

```env
DATABASE_URL=postgresql://atiha:atiha_secure_password_change_in_production@localhost:5432/atiha_db?schema=public
```

### 3. Appliquer la Migration

```bash
npx prisma migrate dev
```

---

## 🚀 Option 3 : Base de Données Externe

Si vous utilisez une base de données externe (ex: Supabase, Railway, etc.) :

### 1. Obtenir l'URL de Connexion

Format : `postgresql://user:password@host:port/database?schema=public`

### 2. Configurer .env.local

```env
DATABASE_URL=votre_url_de_connexion_ici
```

### 3. Appliquer la Migration

```bash
npx prisma migrate dev
```

---

## ✅ Vérification

Après avoir appliqué la migration, vérifiez que les tables ont été créées :

```bash
# Ouvrir Prisma Studio
npx prisma studio
```

Vous devriez voir les nouvelles tables :
- `user_behaviors`
- `anomalies`

---

## 📝 Notes

- La migration a été créée dans `prisma/migrations/`
- Vous pouvez l'appliquer quand PostgreSQL sera disponible
- Les tables seront créées automatiquement lors de l'application de la migration

---

*Guide créé le 22 Novembre 2025*

