# 🚀 Guide de Configuration - Vercel + VPS

**Date:** 2025-11-22  
**Architecture:** Next.js sur Vercel + PostgreSQL/Redis sur VPS

---

## 📋 Architecture Recommandée

```
┌─────────────────┐
│   Vercel        │
│   (Next.js)     │  ← Application Frontend/Backend
└────────┬────────┘
         │
         ├───► VPS (PostgreSQL)
         │     - Base de données
         │     - Port: 5432 (sécurisé)
         │
         └───► VPS (Redis)
               - Rate limiting
               - Sessions
               - Port: 6379 (sécurisé)
```

---

## 🎯 Partie 1 : Configuration VPS

### Prérequis VPS

- **OS:** Ubuntu 22.04 LTS (recommandé)
- **RAM:** Minimum 2GB (4GB recommandé)
- **Stockage:** 20GB minimum
- **Accès:** SSH avec clés

### 1. Installation PostgreSQL sur VPS

```bash
# Se connecter au VPS
ssh user@votre-vps-ip

# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Vérifier l'installation
sudo systemctl status postgresql
```

### 2. Configuration PostgreSQL

```bash
# Passer en utilisateur postgres
sudo -u postgres psql

# Créer la base de données
CREATE DATABASE atiha_db;

# Créer l'utilisateur
CREATE USER atiha WITH PASSWORD 'votre_mot_de_passe_securise_ici';

# Donner les permissions
GRANT ALL PRIVILEGES ON DATABASE atiha_db TO atiha;

# Pour les futures tables
ALTER DATABASE atiha_db OWNER TO atiha;

# Quitter
\q
```

### 3. Configuration Sécurisée PostgreSQL

```bash
# Éditer la configuration PostgreSQL
sudo nano /etc/postgresql/16/main/postgresql.conf

# Modifier :
# listen_addresses = '*'  (ou l'IP de votre VPS)
# port = 5432

# Éditer pg_hba.conf pour autoriser les connexions
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Ajouter à la fin :
# host    atiha_db    atiha    VERCEL_IP/32    md5
# (Remplacer VERCEL_IP par l'IP de Vercel - voir section Vercel)
```

### 4. Installation Redis sur VPS

```bash
# Installer Redis
sudo apt install redis-server -y

# Éditer la configuration
sudo nano /etc/redis/redis.conf

# Modifier :
# bind 0.0.0.0  (ou l'IP de votre VPS)
# requirepass votre_mot_de_passe_redis_securise
# port 6379

# Redémarrer Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 5. Configuration Firewall (UFW)

```bash
# Installer UFW si pas déjà installé
sudo apt install ufw -y

# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser PostgreSQL (seulement depuis Vercel)
# Note: Vous devrez ajouter l'IP de Vercel après
sudo ufw allow from VERCEL_IP to any port 5432

# Autoriser Redis (seulement depuis Vercel)
sudo ufw allow from VERCEL_IP to any port 6379

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### 6. Variables d'Environnement VPS

Créer un fichier pour stocker les credentials :

```bash
# Créer un fichier de configuration
nano ~/atiha_config.env

# Contenu :
POSTGRES_USER=atiha
POSTGRES_PASSWORD=votre_mot_de_passe_securise_ici
POSTGRES_DB=atiha_db
POSTGRES_HOST=votre-vps-ip
POSTGRES_PORT=5432

REDIS_HOST=votre-vps-ip
REDIS_PORT=6379
REDIS_PASSWORD=votre_mot_de_passe_redis_securise
```

---

## 🎯 Partie 2 : Configuration Vercel

### 1. Préparer le Projet

```bash
# Dans votre projet local
# S'assurer que tout est commité
git add .
git commit -m "Préparation déploiement Vercel"
```

### 2. Déployer sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Suivre les instructions
# - Link to existing project? No
# - Project name: atiha
# - Directory: ./
```

### 3. Obtenir l'IP de Vercel

Vercel utilise des IPs dynamiques. Pour obtenir les IPs :

```bash
# Option 1 : Via Vercel Dashboard
# Aller dans Settings → Security → IP Allowlist

# Option 2 : Utiliser un script
# Créer un endpoint pour logger l'IP
```

**Solution Recommandée :** Utiliser un nom de domaine avec Vercel et autoriser ce domaine dans PostgreSQL.

### 4. Variables d'Environnement Vercel

Dans le dashboard Vercel (Settings → Environment Variables) :

#### Variables de Base de Données

```env
DATABASE_URL=postgresql://atiha:votre_mot_de_passe_securise@votre-vps-ip:5432/atiha_db?schema=public&sslmode=require
```

#### Variables Redis

```env
REDIS_URL=redis://:votre_mot_de_passe_redis@votre-vps-ip:6379
REDIS_HOST=votre-vps-ip
REDIS_PORT=6379
REDIS_PASSWORD=votre_mot_de_passe_redis_securise
```

#### Variables de Sécurité

```env
ADMIN_USERNAME=leGenny
ADMIN_PASSWORD=votre_mot_de_passe_admin_securise
ADMIN_SECURITY_CODE=votre_code_securite_securise
JWT_SECRET=votre_jwt_secret_tres_long_et_securise
ENCRYPTION_KEY=votre_cle_32_caracteres_exactement
```

#### Variables Sentry (si utilisé)

```env
SENTRY_DSN=votre_sentry_dsn
SENTRY_AUTH_TOKEN=votre_sentry_token
NEXT_PUBLIC_SENTRY_DSN=votre_sentry_dsn_public
```

#### Variables Publiques (NEXT_PUBLIC_*)

```env
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
NEXT_PUBLIC_APP_NAME=Atiha
```

### 5. Configuration SSL pour PostgreSQL

Vercel nécessite SSL pour les connexions PostgreSQL. Configurer SSL sur le VPS :

```bash
# Générer les certificats SSL pour PostgreSQL
sudo mkdir -p /etc/postgresql/16/main/ssl
cd /etc/postgresql/16/main/ssl

# Générer un certificat auto-signé (pour développement)
sudo openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key -subj "/CN=votre-vps-ip"

# Permissions
sudo chmod 600 server.key
sudo chown postgres:postgres server.key server.crt

# Éditer postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Ajouter :
# ssl = on
# ssl_cert_file = '/etc/postgresql/16/main/ssl/server.crt'
# ssl_key_file = '/etc/postgresql/16/main/ssl/server.key'

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

**Pour Production :** Utiliser des certificats Let's Encrypt ou un certificat signé.

---

## 🔒 Sécurité VPS

### 1. Fail2Ban (Protection contre les attaques)

```bash
# Installer Fail2Ban
sudo apt install fail2ban -y

# Créer la configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Éditer
sudo nano /etc/fail2ban/jail.local

# Activer les protections
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Mise à Jour Automatique

```bash
# Installer unattended-upgrades
sudo apt install unattended-upgrades -y

# Configurer
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Monitoring

```bash
# Installer des outils de monitoring
sudo apt install htop iotop nethogs -y
```

---

## 📊 Appliquer les Migrations Prisma

### Depuis Vercel (Recommandé)

Vercel exécute automatiquement `prisma generate` lors du build. Pour les migrations :

```bash
# Option 1 : Via Vercel CLI (en local)
vercel env pull .env.local
npx prisma migrate deploy

# Option 2 : Via script de déploiement
# Créer vercel.json avec un hook post-deploy
```

### Depuis le VPS

```bash
# Se connecter au VPS
ssh user@votre-vps-ip

# Cloner le projet (temporairement)
git clone votre-repo-url
cd atiha

# Configurer les variables
export DATABASE_URL="postgresql://atiha:password@localhost:5432/atiha_db"

# Appliquer les migrations
npx prisma migrate deploy
```

---

## 🚀 Déploiement

### 1. Push vers Git

```bash
git add .
git commit -m "Configuration Vercel + VPS"
git push origin main
```

### 2. Vercel Déploie Automatiquement

Vercel détecte automatiquement les changements et redéploie.

### 3. Vérifier le Déploiement

- Aller sur `https://votre-projet.vercel.app`
- Vérifier les logs dans Vercel Dashboard
- Tester la connexion à la base de données

---

## ✅ Checklist de Déploiement

### VPS

- [ ] PostgreSQL installé et configuré
- [ ] Redis installé et configuré
- [ ] Base de données créée
- [ ] Utilisateur PostgreSQL créé
- [ ] Firewall configuré
- [ ] SSL configuré pour PostgreSQL
- [ ] Fail2Ban installé
- [ ] Migrations appliquées

### Vercel

- [ ] Projet déployé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] DATABASE_URL configuré avec SSL
- [ ] REDIS_URL configuré
- [ ] Variables de sécurité configurées
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Build réussi
- [ ] Application accessible

---

## 🔧 Dépannage

### Erreur : "Can't reach database server"

**Solutions:**
1. Vérifier que PostgreSQL écoute sur toutes les interfaces
2. Vérifier le firewall (UFW)
3. Vérifier que l'IP de Vercel est autorisée
4. Vérifier les credentials dans DATABASE_URL

### Erreur : "SSL required"

**Solution:** Ajouter `?sslmode=require` à la fin de DATABASE_URL

### Erreur : "Connection timeout"

**Solutions:**
1. Vérifier que le port 5432 est ouvert
2. Vérifier que PostgreSQL écoute sur l'IP publique
3. Vérifier les règles de firewall

---

## 📝 Notes Importantes

### IPs Vercel

Vercel utilise des IPs dynamiques. Pour autoriser Vercel dans PostgreSQL :

1. **Option 1 :** Utiliser un nom de domaine et autoriser le domaine
2. **Option 2 :** Utiliser Vercel IP Allowlist (si disponible)
3. **Option 3 :** Autoriser toutes les IPs (moins sécurisé, à éviter en production)

### Performance

- **VPS Location:** Choisir un VPS proche de vos utilisateurs
- **Vercel Region:** Configurer la région dans `vercel.json`
- **Connection Pooling:** Utiliser PgBouncer ou un service de pooling

### Backup

Configurer des backups automatiques de PostgreSQL :

```bash
# Créer un script de backup
nano ~/backup_postgres.sh

# Contenu :
#!/bin/bash
pg_dump -U atiha atiha_db > ~/backups/atiha_db_$(date +%Y%m%d_%H%M%S).sql

# Ajouter au cron
crontab -e
# Ajouter : 0 2 * * * /home/user/backup_postgres.sh
```

---

*Guide créé le 22 Novembre 2025*

