# 🔒 Guide de Sécurité - Application Atiha

**Date:** 2 Février 2025  
**Version:** 1.0.0

---

## 📋 Table des Matières

1. [Vérification de Sécurité](#vérification-de-sécurité)
2. [Configuration Sécurisée](#configuration-sécurisée)
3. [Bonnes Pratiques](#bonnes-pratiques)
4. [Scripts de Vérification](#scripts-de-vérification)
5. [Checklist de Sécurité](#checklist-de-sécurité)

---

## 🔍 Vérification de Sécurité

### Script Automatique

Un script de vérification de sécurité est disponible pour détecter automatiquement les problèmes courants :

```bash
npm run security:check
```

ou

```bash
npm run security:report
```

### Ce que le Script Vérifie

#### Problèmes Critiques 🔴
- Variables `NEXT_PUBLIC_*` utilisées pour des données sensibles
- Mots de passe hardcodés dans le code
- Clés API hardcodées
- Secrets hardcodés

#### Avertissements ⚠️
- Utilisation de `console.log` au lieu du logger centralisé
- Utilisation de `eval()`
- Utilisation de `innerHTML` (risque XSS)

#### Informations ℹ️
- TODO/FIXME liés à la sécurité

---

## 🔐 Configuration Sécurisée

### Variables d'Environnement

**⚠️ CRITIQUE:** Ne jamais committer les fichiers `.env.local` ou `.env` avec des valeurs réelles.

#### Variables Requises

```env
# Identifiants admin (OBLIGATOIRE)
ADMIN_USERNAME=votre_username
ADMIN_PASSWORD=votre_mot_de_passe_securise
ADMIN_SECURITY_CODE=votre_code_securite

# Clés de chiffrement (OBLIGATOIRE)
ENCRYPTION_KEY=votre_cle_32_caracteres_hex
JWT_SECRET=votre_secret_64_caracteres_hex
```

#### Génération des Clés

```bash
# Générer ENCRYPTION_KEY (32 caractères hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Générer JWT_SECRET (64 caractères hex)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Permissions des Fichiers

```bash
# Restreindre l'accès au fichier .env.local
chmod 600 .env.local
```

---

## ✅ Bonnes Pratiques

### 1. Variables d'Environnement

❌ **NE PAS FAIRE:**
```typescript
// ❌ Exposé côté client
const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
```

✅ **FAIRE:**
```typescript
// ✅ Serveur uniquement
const password = process.env.ADMIN_PASSWORD
```

### 2. Logging

❌ **NE PAS FAIRE:**
```typescript
console.log('User data:', userData)
console.error('Error:', error)
```

✅ **FAIRE:**
```typescript
import { logger } from '@/lib/logger'

logger.info('User data', { userId: userData.id })
logger.error('Error', error, { context })
```

### 3. Mots de Passe

❌ **NE PAS FAIRE:**
```typescript
const password = 'hardcoded_password_123'
```

✅ **FAIRE:**
```typescript
const password = process.env.ADMIN_PASSWORD
if (!password) {
  throw new Error('ADMIN_PASSWORD not configured')
}
```

### 4. Validation des Données

✅ **TOUJOURS:**
- Valider les entrées utilisateur
- Sanitizer les données avant stockage
- Utiliser des types TypeScript stricts

---

## 🛠️ Scripts de Vérification

### Vérification de Sécurité

```bash
npm run security:check
```

### Audit NPM

```bash
npm audit
npm audit fix
```

### Linting

```bash
npm run lint
```

---

## ✅ Checklist de Sécurité

### Avant le Déploiement

- [ ] **Variables d'Environnement**
  - [ ] Toutes les variables requises sont configurées
  - [ ] Aucune valeur par défaut hardcodée
  - [ ] `.env.local` a les permissions 600
  - [ ] `.env.local` est dans `.gitignore`

- [ ] **Code**
  - [ ] Aucun mot de passe hardcodé
  - [ ] Aucune clé API hardcodée
  - [ ] Aucun secret hardcodé
  - [ ] Pas de `NEXT_PUBLIC_*` pour données sensibles
  - [ ] Logger centralisé utilisé partout

- [ ] **Configuration**
  - [ ] SSL/HTTPS configuré
  - [ ] Headers de sécurité configurés
  - [ ] Rate limiting actif
  - [ ] CSP configurée

- [ ] **Tests**
  - [ ] Script de sécurité exécuté (`npm run security:check`)
  - [ ] Aucun problème critique détecté
  - [ ] Tests de sécurité passés

### Après le Déploiement

- [ ] **Monitoring**
  - [ ] Logs surveillés
  - [ ] Alertes configurées
  - [ ] Erreurs critiques tracées

- [ ] **Vérifications**
  - [ ] Connexion admin testée
  - [ ] Chiffrement des données vérifié
  - [ ] Headers de sécurité présents

---

## 📚 Documentation Complémentaire

- `GUIDE_CONFIGURATION_PRODUCTION.md` - Guide complet de configuration
- `CORRECTIONS_CRITIQUES_APPLIQUEES.md` - Détails des corrections appliquées
- `AUDIT_COMPLET_2025-02-02.md` - Audit complet de l'application

---

## 🆘 En Cas de Problème

1. **Vérifier les logs**
   ```bash
   # Vérifier les logs de l'application
   # Vérifier les logs du serveur
   ```

2. **Exécuter le script de sécurité**
   ```bash
   npm run security:check
   ```

3. **Vérifier la configuration**
   - Vérifier que toutes les variables d'environnement sont présentes
   - Vérifier les permissions des fichiers

4. **Consulter la documentation**
   - `GUIDE_CONFIGURATION_PRODUCTION.md`
   - `CORRECTIONS_CRITIQUES_APPLIQUEES.md`

---

**⚠️ IMPORTANT:** La sécurité est une responsabilité continue. Vérifiez régulièrement votre configuration et mettez à jour les dépendances.

---

*Guide créé le 2 Février 2025*

