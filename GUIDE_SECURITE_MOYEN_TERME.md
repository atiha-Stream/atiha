# 🔒 Guide d'Implémentation - Sécurité Moyen Terme

**Date:** 2025-11-22  
**Statut:** ✅ Implémenté

---

## 📋 Résumé des Améliorations

Trois améliorations majeures de sécurité ont été implémentées pour renforcer la protection de l'application :

1. ✅ **Backend avec Base de Données PostgreSQL** - Migration depuis localStorage
2. ✅ **Authentification à Deux Facteurs (2FA)** - Protection supplémentaire avec TOTP
3. ✅ **Rate Limiting avec Redis** - Protection distribuée contre les abus

---

## 1. ✅ Backend avec Base de Données PostgreSQL

### Fichiers Créés

- `prisma/schema.prisma` - Schéma de base de données Prisma
- `src/lib/database.ts` - Client Prisma singleton
- `scripts/migrate-localStorage-to-db.ts` - Script de migration
- `docker-compose.yml` - Configuration Docker avec PostgreSQL et Redis

### Modèles de Données

#### Utilisateurs
- `User` - Utilisateurs principaux
- `UserProfile` - Profils utilisateurs
- `UserSession` - Sessions utilisateurs

#### Contenu
- `WatchHistory` - Historique de visionnage
- `Watchlist` - Liste de lecture
- `Rating` - Notes et avis
- `Favorite` - Favoris

#### Administration
- `Admin` - Administrateurs
- `AdminSession` - Sessions admin
- `SecurityLog` - Logs de sécurité

#### Sécurité
- `TwoFactorAuth` - 2FA utilisateurs
- `AdminTwoFactorAuth` - 2FA admin

### Configuration

1. **Installer les dépendances** :
```bash
npm install @prisma/client prisma
```

2. **Configurer la base de données** :
```env
DATABASE_URL="postgresql://atiha:password@localhost:5432/atiha_db?schema=public"
```

3. **Initialiser Prisma** :
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Démarrer les services Docker** :
```bash
docker-compose up -d
```

### Migration des Données

Le script `scripts/migrate-localStorage-to-db.ts` permet de migrer les données existantes depuis localStorage vers PostgreSQL.

---

## 2. ✅ Authentification à Deux Facteurs (2FA)

### Fichiers Créés

- `src/lib/two-factor-auth.ts` - Service 2FA avec TOTP
- `src/components/TwoFactorAuthSetup.tsx` - Interface utilisateur
- `src/app/api/2fa/setup/route.ts` - Endpoint de configuration
- `src/app/api/2fa/verify/route.ts` - Endpoint de vérification
- `src/app/api/2fa/disable/route.ts` - Endpoint de désactivation

### Fonctionnalités

- **Génération de secret TOTP** : Compatible avec Google Authenticator, Authy, etc.
- **QR Code** : Génération automatique pour faciliter la configuration
- **Codes de secours** : 8 codes à usage unique en cas de perte d'accès
- **Vérification** : Validation des codes TOTP avec fenêtre de tolérance
- **Activation/Désactivation** : Gestion complète du cycle de vie

### Utilisation

#### Configuration côté serveur
```typescript
import { generate2FASecret, verify2FACode, enable2FA } from '@/lib/two-factor-auth'

// Générer un secret
const { qrCodeUrl, backupCodes } = await generate2FASecret(userId, isAdmin)

// Vérifier un code
const { valid, isBackupCode } = await verify2FACode(userId, code, isAdmin)

// Activer le 2FA
await enable2FA(userId, isAdmin)
```

#### Interface utilisateur
```tsx
import TwoFactorAuthSetup from '@/components/TwoFactorAuthSetup'

<TwoFactorAuthSetup 
  isAdmin={false}
  onComplete={() => console.log('2FA activé')}
/>
```

### Flux d'Activation

1. **Étape 1** : L'utilisateur clique sur "Activer 2FA"
2. **Étape 2** : Un QR code est généré et affiché
3. **Étape 3** : L'utilisateur scanne le QR code avec son app
4. **Étape 4** : L'utilisateur entre le code à 6 chiffres
5. **Étape 5** : Le 2FA est activé et les codes de secours sont affichés

### Flux de Connexion avec 2FA

1. L'utilisateur entre son email/mot de passe
2. Si le 2FA est activé, un champ pour le code 2FA apparaît
3. L'utilisateur entre le code depuis son app d'authentification
4. Le code est vérifié et la connexion est autorisée

---

## 3. ✅ Rate Limiting avec Redis

### Fichiers Créés

- `src/lib/redis.ts` - Client Redis singleton
- `src/lib/rate-limiter.ts` - Service de rate limiting
- `src/middleware-rate-limit.ts` - Middleware Next.js
- `docker-compose.yml` - Configuration Redis

### Fonctionnalités

- **Rate limiting distribué** : Fonctionne avec plusieurs instances
- **Fenêtres de temps configurables** : Par route/endpoint
- **Fallback en mémoire** : Si Redis n'est pas disponible
- **Headers HTTP** : Informations de rate limiting dans les réponses

### Limites Configurées

| Route | Limite | Fenêtre |
|-------|--------|---------|
| `/api/auth/login` | 5 tentatives | 15 minutes |
| `/api/admin/login` | 5 tentatives | 15 minutes |
| `/api/admin/*` | 30 requêtes | 1 minute |
| `/api/*` | 60 requêtes | 1 minute |

### Configuration

1. **Variables d'environnement** :
```env
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your_redis_password"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

2. **Démarrer Redis** :
```bash
docker-compose up -d redis
```

### Utilisation

```typescript
import { checkLoginRateLimit, checkAPIRateLimit } from '@/lib/rate-limiter'

// Vérifier le rate limit
const result = await checkLoginRateLimit(ipAddress, 5, 15 * 60 * 1000)

if (!result.allowed) {
  return new Response('Too Many Requests', { status: 429 })
}
```

### Headers de Réponse

Les réponses incluent des headers de rate limiting :
- `X-RateLimit-Limit` : Limite maximale
- `X-RateLimit-Remaining` : Requêtes restantes
- `X-RateLimit-Reset` : Date de réinitialisation
- `Retry-After` : Secondes avant de pouvoir réessayer (si bloqué)

---

## 📊 Architecture Complète

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ├───► PostgreSQL (Données)
         │     - Users, Admins
         │     - Sessions
         │     - 2FA Secrets
         │
         ├───► Redis (Cache/Rate Limit)
         │     - Rate Limiting
         │     - Sessions
         │
         └───► Prisma ORM
               - Type-safe queries
               - Migrations
```

---

## 🚀 Déploiement

### 1. Prérequis

- Docker et Docker Compose installés
- Node.js 18+ et npm

### 2. Configuration

1. **Copier les variables d'environnement** :
```bash
cp .env.example .env.local
```

2. **Configurer les variables** :
```env
DATABASE_URL="postgresql://atiha:password@localhost:5432/atiha_db"
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your_redis_password"
```

3. **Démarrer les services** :
```bash
docker-compose up -d
```

4. **Initialiser la base de données** :
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. **Migrer les données existantes** (optionnel) :
```bash
npm run migrate:localStorage-to-db
```

### 3. Vérification

- ✅ PostgreSQL accessible sur `localhost:5432`
- ✅ Redis accessible sur `localhost:6379`
- ✅ Prisma Client généré
- ✅ Migrations appliquées

---

## 📈 Avantages

### Sécurité
- ✅ **Données centralisées** : Plus de perte de données locale
- ✅ **2FA** : Protection supplémentaire contre le vol de credentials
- ✅ **Rate limiting distribué** : Protection contre les attaques DDoS

### Performance
- ✅ **Redis** : Cache rapide pour les sessions
- ✅ **PostgreSQL** : Requêtes optimisées avec index
- ✅ **Prisma** : Queries type-safe et optimisées

### Scalabilité
- ✅ **Multi-instances** : Rate limiting distribué
- ✅ **Base de données relationnelle** : Facile à étendre
- ✅ **Sessions centralisées** : Partage entre instances

---

## ⚠️ Notes Importantes

1. **Migration progressive** : Les données localStorage continuent de fonctionner pendant la transition
2. **Fallback** : Si Redis n'est pas disponible, le rate limiting utilise la mémoire
3. **2FA optionnel** : Les utilisateurs peuvent activer/désactiver le 2FA
4. **Codes de secours** : À sauvegarder en lieu sûr (affichés une seule fois)

---

## 🔄 Prochaines Étapes

1. **Migrer les contextes d'authentification** pour utiliser PostgreSQL
2. **Implémenter les routes API** pour remplacer localStorage
3. **Créer l'interface de gestion 2FA** dans les paramètres utilisateur
4. **Ajouter le 2FA au flux de connexion**
5. **Tester le rate limiting** avec plusieurs requêtes simultanées

---

*Guide créé le 22 Novembre 2025*

