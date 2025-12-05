# 🔐 Guide de Configuration .env.local

**Date:** 2 Février 2025

---

## 📋 Instructions

Le fichier `.env.local` existe déjà dans votre projet. Voici comment le configurer correctement.

---

## ✅ Vérification Rapide

Vérifiez que votre fichier `.env.local` contient au minimum ces variables :

```env
ADMIN_USERNAME=leGenny
ADMIN_PASSWORD=votre_mot_de_passe_securise
ADMIN_SECURITY_CODE=votre_code_securite
ENCRYPTION_KEY=votre_cle_32_caracteres_hex
JWT_SECRET=votre_secret_64_caracteres_hex
```

---

## 🔑 Génération des Clés

Si vous devez générer de nouvelles clés, utilisez ces commandes :

### Générer ENCRYPTION_KEY (32 caractères hex)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Générer JWT_SECRET (64 caractères hex)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Générer un Mot de Passe Sécurisé
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

---

## 🚀 Génération Automatique

Vous pouvez aussi utiliser le script automatique :

```bash
npm run env:generate
```

**Note:** Si `.env.local` existe déjà, le script vous demandera de le supprimer d'abord.

---

## 📝 Exemple de Configuration Complète

```env
# Identifiants admin
ADMIN_USERNAME=leGenny
ADMIN_PASSWORD=VotreMotDePasseSecurise123!@#
ADMIN_SECURITY_CODE=VotreCodeSecurite2025!@#

# Clés de chiffrement (générées automatiquement)
ENCRYPTION_KEY=6cdaf84a8281148441871d02ab7783fdb5570c0bd6ca6a71d94e36839b73f487
JWT_SECRET=df84e6f2f68bb379f79a6903deced0bd4775b6e4d3397cd03af1439ca4241d141fcc503b1d09a05af75c931087ec2c62428536d7f45d191360c33b1cb42d298c

# Configuration de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Atiha

# Configuration de sécurité
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=5
BCRYPT_SALT_ROUNDS=12
SESSION_TIMEOUT=3600000
```

---

## ⚠️ Sécurité

1. **Ne JAMAIS committer** `.env.local` dans Git
2. **Vérifier** que `.env.local` est dans `.gitignore`
3. **Changer** les valeurs par défaut en production
4. **Utiliser** des mots de passe forts (minimum 12 caractères)
5. **Générer** des clés uniques pour chaque environnement

---

## ✅ Vérification

Après configuration, vérifiez que tout fonctionne :

```bash
# 1. Vérifier la sécurité
npm run security:check

# 2. Démarrer l'application
npm run dev

# 3. Tester la connexion admin
# Aller sur http://localhost:3000/admin/login
```

---

## 🔄 Régénération

Si vous devez régénérer le fichier :

```bash
# 1. Supprimer l'ancien fichier
rm .env.local  # Linux/Mac
del .env.local  # Windows

# 2. Régénérer
npm run env:generate
```

---

**Pour plus de détails, voir `GUIDE_CONFIGURATION_PRODUCTION.md`**

