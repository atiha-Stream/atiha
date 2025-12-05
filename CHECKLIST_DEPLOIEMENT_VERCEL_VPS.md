# ✅ Checklist de Déploiement - Vercel + VPS

**Date:** 2025-11-22  
**Architecture:** Next.js (Vercel) + PostgreSQL/Redis (VPS)

---

## 📋 Phase 1 : Configuration VPS

### Installation de Base

- [ ] VPS créé (Ubuntu 22.04 LTS recommandé)
- [ ] Accès SSH configuré avec clés
- [ ] Système mis à jour (`sudo apt update && sudo apt upgrade -y`)

### PostgreSQL

- [ ] PostgreSQL installé (`sudo apt install postgresql postgresql-contrib -y`)
- [ ] Base de données `atiha_db` créée
- [ ] Utilisateur `atiha` créé avec mot de passe sécurisé
- [ ] Permissions configurées
- [ ] PostgreSQL configuré pour écouter sur toutes les interfaces
- [ ] SSL configuré pour PostgreSQL
- [ ] `pg_hba.conf` configuré pour autoriser Vercel

### Redis

- [ ] Redis installé (`sudo apt install redis-server -y`)
- [ ] Mot de passe Redis configuré
- [ ] Redis configuré pour écouter sur toutes les interfaces
- [ ] Redis redémarré et testé

### Sécurité

- [ ] UFW installé et configuré
- [ ] Port SSH (22) autorisé
- [ ] Fail2Ban installé et configuré
- [ ] Mises à jour automatiques configurées
- [ ] Mots de passe par défaut changés

### Migrations

- [ ] Migrations Prisma appliquées
- [ ] Tables créées (`user_behaviors`, `anomalies`)
- [ ] Vérification via `npx prisma studio` ou `psql`

---

## 📋 Phase 2 : Configuration Vercel

### Déploiement Initial

- [ ] Vercel CLI installé (`npm i -g vercel`)
- [ ] Connecté à Vercel (`vercel login`)
- [ ] Projet déployé (`vercel`)
- [ ] Build réussi

### Variables d'Environnement

- [ ] `DATABASE_URL` configuré avec SSL
- [ ] `REDIS_URL` configuré
- [ ] `REDIS_HOST` configuré
- [ ] `REDIS_PORT` configuré
- [ ] `REDIS_PASSWORD` configuré
- [ ] `ADMIN_USERNAME` configuré
- [ ] `ADMIN_PASSWORD` configuré (sécurisé)
- [ ] `ADMIN_SECURITY_CODE` configuré (sécurisé)
- [ ] `JWT_SECRET` configuré (très long et sécurisé)
- [ ] `ENCRYPTION_KEY` configuré (32 caractères exactement)
- [ ] `NEXT_PUBLIC_APP_URL` configuré
- [ ] `NEXT_PUBLIC_APP_NAME` configuré
- [ ] Variables Sentry configurées (si utilisé)

### Configuration

- [ ] `vercel.json` configuré
- [ ] Région Vercel choisie (CDG1 recommandé pour l'Europe)
- [ ] Domaine personnalisé configuré (optionnel)

---

## 📋 Phase 3 : Connexion Vercel ↔ VPS

### Firewall VPS

- [ ] IP de Vercel identifiée (ou domaine configuré)
- [ ] Port 5432 (PostgreSQL) autorisé depuis Vercel
- [ ] Port 6379 (Redis) autorisé depuis Vercel
- [ ] UFW activé et testé

### Test de Connexion

- [ ] Connexion PostgreSQL testée depuis Vercel
- [ ] Connexion Redis testée depuis Vercel
- [ ] Logs Vercel vérifiés (pas d'erreurs de connexion)
- [ ] Application accessible et fonctionnelle

---

## 📋 Phase 4 : Vérifications Finales

### Application

- [ ] Page d'accueil accessible
- [ ] Connexion utilisateur fonctionne
- [ ] Connexion admin fonctionne
- [ ] API routes fonctionnent
- [ ] Base de données accessible
- [ ] Redis fonctionne (rate limiting)

### Détection d'Anomalies

- [ ] Actions utilisateur trackées
- [ ] Anomalies détectées (tester avec actions massives)
- [ ] Interface admin pour voir les anomalies
- [ ] Résolution d'anomalies fonctionne

### Sécurité

- [ ] HTTPS activé (automatique sur Vercel)
- [ ] Headers de sécurité présents
- [ ] Rate limiting fonctionne
- [ ] CSRF protection active
- [ ] HttpOnly cookies configurés

---

## 🔧 Commandes Utiles

### VPS

```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Vérifier Redis
sudo systemctl status redis-server

# Voir les logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Se connecter à PostgreSQL
sudo -u postgres psql -d atiha_db

# Voir les tables
\dt

# Voir les anomalies
SELECT * FROM anomalies ORDER BY detected_at DESC LIMIT 10;
```

### Vercel

```bash
# Voir les logs
vercel logs

# Redéployer
vercel --prod

# Voir les variables d'environnement
vercel env ls
```

---

## ⚠️ Points d'Attention

### Sécurité

1. **Mots de passe forts** : Utiliser des générateurs de mots de passe
2. **SSL obligatoire** : PostgreSQL doit avoir SSL activé
3. **Firewall strict** : Autoriser uniquement Vercel
4. **Backups réguliers** : Configurer des backups automatiques

### Performance

1. **Connection Pooling** : Considérer PgBouncer pour PostgreSQL
2. **Redis Persistence** : Configurer AOF pour Redis
3. **Monitoring** : Installer des outils de monitoring (Prometheus, Grafana)

### Coûts

1. **Vercel** : Plan gratuit disponible (limites)
2. **VPS** : ~5-20€/mois selon la configuration
3. **Domaine** : ~10-15€/an

---

## 📚 Documentation

- **`GUIDE_CONFIGURATION_VERCEL_VPS.md`** - Guide complet
- **`GUIDE_MIGRATION_VERCEL.md`** - Application des migrations
- **`RESUME_CONFIGURATION_VERCEL_VPS.md`** - Résumé
- **`APPLIQUER_MIGRATION.md`** - Migration actuelle

---

*Checklist créée le 22 Novembre 2025*

