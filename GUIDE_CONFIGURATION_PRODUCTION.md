# 🚀 Guide de Configuration pour la Production

**Date:** 2 Février 2025  
**Version:** 1.0.0

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration des Variables d'Environnement](#configuration-des-variables-denvironnement)
3. [Génération des Clés de Sécurité](#génération-des-clés-de-sécurité)
4. [Configuration du Serveur](#configuration-du-serveur)
5. [Vérification de la Configuration](#vérification-de-la-configuration)
6. [Déploiement](#déploiement)
7. [Checklist de Production](#checklist-de-production)

---

## 📦 Prérequis

- Node.js 18+ installé
- Accès au serveur de production
- Domaine configuré avec SSL/HTTPS
- Accès root ou sudo sur le serveur

---

## 🔐 Configuration des Variables d'Environnement

### 1. Créer le fichier `.env.local`

```bash
# Sur le serveur de production
cd /chemin/vers/votre/application
cp env.secure.example .env.local
nano .env.local  # ou votre éditeur préféré
```

### 2. Variables OBLIGATOIRES

Ces variables **DOIVENT** être configurées avant le déploiement :

```env
# ============================================
# IDENTIFIANTS ADMIN (OBLIGATOIRE)
# ============================================
# ⚠️ CRITIQUE: Ne JAMAIS utiliser les valeurs par défaut en production
ADMIN_USERNAME=votre_username_admin_unique
ADMIN_PASSWORD=votre_mot_de_passe_tres_securise_min_12_caracteres
ADMIN_SECURITY_CODE=votre_code_securite_unique_min_10_caracteres

# ============================================
# CLÉS DE CHIFFREMENT (OBLIGATOIRE)
# ============================================
ENCRYPTION_KEY=votre_cle_de_32_caracteres_hexadecimaux
JWT_SECRET=votre_secret_jwt_de_64_caracteres_hexadecimaux
```

### 3. Variables RECOMMANDÉES

```env
# Configuration de l'application
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NEXT_PUBLIC_APP_NAME=Atiha

# Configuration de sécurité
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=5
BCRYPT_SALT_ROUNDS=12
SESSION_TIMEOUT=3600000
```

### 4. Variables OPTIONNELLES

```env
# Configuration de sécurité avancée
ADMIN_SECURITY_QUESTION=Votre question personnalisée
ADMIN_SECURITY_ANSWER=Votre réponse

# Configuration de chiffrement
AES_KEY_LENGTH=256
GCM_IV_LENGTH=12
```

---

## 🔑 Génération des Clés de Sécurité

### Générer ENCRYPTION_KEY (32 caractères hexadécimaux)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemple de sortie:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Générer JWT_SECRET (64 caractères hexadécimaux)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Exemple de sortie:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Générer un Mot de Passe Sécurisé

```bash
# Option 1: Utiliser openssl
openssl rand -base64 32

# Option 2: Utiliser Node.js
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

**Recommandations pour le mot de passe admin:**
- Minimum 12 caractères
- Mélange de majuscules, minuscules, chiffres et symboles
- Ne pas utiliser de mots du dictionnaire
- Unique pour cette application

---

## 🖥️ Configuration du Serveur

### 1. Variables d'Environnement Système

Pour une sécurité maximale, vous pouvez aussi définir les variables au niveau système :

```bash
# Dans /etc/environment ou ~/.bashrc
export ADMIN_USERNAME="votre_username"
export ADMIN_PASSWORD="votre_mot_de_passe"
export ADMIN_SECURITY_CODE="votre_code"
export ENCRYPTION_KEY="votre_cle"
export JWT_SECRET="votre_secret"
```

### 2. Permissions du Fichier .env.local

```bash
# Restreindre l'accès au fichier .env.local
chmod 600 .env.local
chown votre_user:votre_group .env.local
```

### 3. Vérifier que .env.local est dans .gitignore

```bash
# Vérifier que .env.local est bien ignoré
grep -q "\.env\.local" .gitignore && echo "✅ OK" || echo "❌ À ajouter"
```

---

## ✅ Vérification de la Configuration

### 1. Vérifier les Variables d'Environnement

L'application valide automatiquement les variables au démarrage. Vérifiez les logs :

```bash
npm run dev
# ou
npm start
```

Vous devriez voir :
```
✅ Toutes les variables d'environnement sont correctement configurées
```

Si vous voyez des erreurs :
```
❌ ERREUR: Variables d'environnement manquantes:
   - ADMIN_USERNAME
   - ADMIN_PASSWORD
```

### 2. Tester la Connexion Admin

1. Accéder à `/admin/login`
2. Se connecter avec les credentials configurés
3. Vérifier que la connexion fonctionne

### 3. Vérifier le Chiffrement

L'application chiffre automatiquement les données sensibles. Vérifiez dans les DevTools :

```javascript
// Dans la console du navigateur
localStorage.getItem('atiha_admin_credentials')
// Devrait commencer par "__encrypted__"
```

---

## 🚀 Déploiement

### 1. Build de Production

```bash
# Installer les dépendances
npm install

# Build de production
npm run build

# Vérifier qu'il n'y a pas d'erreurs
npm run lint
```

### 2. Démarrer le Serveur

```bash
# Démarrer en production
npm start

# Ou avec PM2 (recommandé)
pm2 start npm --name "atiha" -- start
pm2 save
pm2 startup
```

### 3. Configuration Nginx (Exemple)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /chemin/vers/cert.pem;
    ssl_certificate_key /chemin/vers/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ✅ Checklist de Production

### Avant le Déploiement

- [ ] **Variables d'Environnement**
  - [ ] `.env.local` créé avec toutes les variables requises
  - [ ] `ADMIN_USERNAME` configuré (pas la valeur par défaut)
  - [ ] `ADMIN_PASSWORD` configuré (mot de passe sécurisé unique)
  - [ ] `ADMIN_SECURITY_CODE` configuré (code unique)
  - [ ] `ENCRYPTION_KEY` généré (32 caractères hex)
  - [ ] `JWT_SECRET` généré (64 caractères hex)
  - [ ] `NEXT_PUBLIC_APP_URL` configuré avec le domaine de production
  - [ ] `ALLOW_DEFAULT_ADMIN_CREDENTIALS` non défini ou `false`

- [ ] **Sécurité**
  - [ ] `.env.local` a les permissions 600
  - [ ] `.env.local` est dans `.gitignore`
  - [ ] SSL/HTTPS configuré et fonctionnel
  - [ ] Headers de sécurité vérifiés (HSTS, CSP, etc.)
  - [ ] Rate limiting testé

- [ ] **Configuration Serveur**
  - [ ] Node.js 18+ installé
  - [ ] Port 3000 (ou autre) ouvert et accessible
  - [ ] Firewall configuré correctement
  - [ ] Nginx/Apache configuré avec HTTPS
  - [ ] Redirection HTTP → HTTPS active

- [ ] **Tests**
  - [ ] Build de production réussi (`npm run build`)
  - [ ] Pas d'erreurs de lint (`npm run lint`)
  - [ ] Validation des variables d'environnement OK
  - [ ] Connexion admin testée
  - [ ] Chiffrement des données vérifié

### Après le Déploiement

- [ ] **Vérifications Post-Déploiement**
  - [ ] Application accessible via HTTPS
  - [ ] Connexion admin fonctionnelle
  - [ ] Pas d'erreurs dans les logs
  - [ ] Headers de sécurité présents
  - [ ] Rate limiting actif
  - [ ] Monitoring configuré (optionnel mais recommandé)

---

## 🔍 Dépannage

### Erreur: "Variables d'environnement manquantes"

**Solution:**
1. Vérifier que `.env.local` existe
2. Vérifier que toutes les variables requises sont présentes
3. Vérifier qu'il n'y a pas d'espaces avant/après les valeurs
4. Redémarrer l'application

### Erreur: "Impossible d'initialiser les credentials admin"

**Solution:**
1. Vérifier que `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECURITY_CODE` sont définis
2. En développement, définir `ALLOW_DEFAULT_ADMIN_CREDENTIALS=true` si nécessaire
3. Vérifier les logs pour plus de détails

### Erreur: "Configuration invalide en production"

**Solution:**
1. Vérifier qu'aucune variable n'utilise les valeurs par défaut
2. Vérifier qu'aucune variable `NEXT_PUBLIC_ADMIN_*` n'est utilisée
3. Générer de nouvelles clés de chiffrement

---

## 📞 Support

En cas de problème :
1. Vérifier les logs de l'application
2. Vérifier les logs du serveur (Nginx/Apache)
3. Vérifier la configuration des variables d'environnement
4. Consulter la documentation de l'audit (`AUDIT_COMPLET_2025-02-02.md`)

---

**⚠️ IMPORTANT:** Ne jamais committer le fichier `.env.local` dans le dépôt Git!

---

*Guide créé le 2 Février 2025*

