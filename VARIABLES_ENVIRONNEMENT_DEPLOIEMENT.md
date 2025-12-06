# 🔐 Variables d'Environnement pour le Déploiement

**Date** : 2025-12-06  
**Plateforme** : Vercel + PostgreSQL (Prisma)

---

## 📋 Variables OBLIGATOIRES

### 1. Base de Données PostgreSQL (Prisma)

Ces 3 variables sont **OBLIGATOIRES** pour que l'application fonctionne :

#### `DATABASE_URL`
```
postgres://user:password@host:port/database?sslmode=require
```
- **Description** : URL de connexion directe PostgreSQL pour Prisma
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Où trouver** : Dans votre dashboard Vercel Postgres ou Prisma Data Platform

#### `POSTGRES_URL`
```
postgres://user:password@host:port/database?sslmode=require
```
- **Description** : URL PostgreSQL (identique à DATABASE_URL)
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Note** : Généralement identique à `DATABASE_URL`

#### `PRISMA_DATABASE_URL`
```
prisma+postgres://accelerate.prisma-data.net/?api_key=VOTRE_API_KEY
```
- **Description** : URL Prisma avec Accelerate (connection pooling - recommandé pour la production)
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Où trouver** : Dans votre dashboard Prisma Data Platform → Accelerate
- **Note** : Optionnel mais recommandé pour de meilleures performances

---

## 📋 Variables RECOMMANDÉES

### 2. Configuration Admin

#### `ADMIN_USERNAME`
```
leGenny
```
- **Description** : Nom d'utilisateur pour la connexion admin
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Sécurité** : ⚠️ Ne pas utiliser `NEXT_PUBLIC_*` pour cette variable

#### `ADMIN_PASSWORD`
```
votre_mot_de_passe_admin_securise
```
- **Description** : Mot de passe pour la connexion admin
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Sécurité** : ⚠️ Ne pas utiliser `NEXT_PUBLIC_*` pour cette variable

#### `ADMIN_SECURITY_CODE`
```
votre_code_securite_admin
```
- **Description** : Code de sécurité pour la connexion admin
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Sécurité** : ⚠️ Ne pas utiliser `NEXT_PUBLIC_*` pour cette variable

---

### 3. JWT et Sécurité

#### `JWT_SECRET`
```
votre_cle_secrete_jwt_super_securisee_changez_en_production
```
- **Description** : Clé secrète pour signer les tokens JWT
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Génération** : Utilisez une chaîne aléatoire de 32+ caractères

#### `JWT_EXPIRE`
```
7d
```
- **Description** : Durée d'expiration des tokens JWT
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Valeurs possibles** : `1h`, `7d`, `30d`, etc.

#### `ENCRYPTION_KEY`
```
votre_cle_chiffrement_32_caracteres
```
- **Description** : Clé de chiffrement (256 bits = 32 caractères)
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Génération** : Utilisez une chaîne aléatoire de 32 caractères exactement

---

### 4. Configuration Serveur

#### `NODE_ENV`
```
production
```
- **Description** : Environnement d'exécution
- **Environnements** : ✅ Production (`production`), ✅ Preview (`preview`), ✅ Development (`development`)
- **Valeurs** : `production`, `development`, `preview`

#### `PORT`
```
3000
```
- **Description** : Port sur lequel l'application écoute
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Note** : Vercel gère automatiquement le port, mais peut être utile pour le développement local

---

### 5. URLs Frontend (Publiques)

Ces variables peuvent être publiques (préfixe `NEXT_PUBLIC_`) :

#### `NEXT_PUBLIC_APP_URL`
```
https://votre-domaine.vercel.app
```
- **Description** : URL publique de l'application
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Note** : Utilisez votre domaine Vercel ou domaine personnalisé

#### `NEXT_PUBLIC_APP_NAME`
```
Atiha
```
- **Description** : Nom de l'application
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development

---

## 📋 Variables OPTIONNELLES

### 6. Email (si vous utilisez l'envoi d'emails)

#### `EMAIL_SERVICE`
```
gmail
```
- **Description** : Service d'email à utiliser
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development

#### `EMAIL_USER`
```
votre_email@gmail.com
```
- **Description** : Adresse email pour l'envoi
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development

#### `EMAIL_PASS`
```
votre_mot_de_passe_application
```
- **Description** : Mot de passe d'application pour l'email
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development

---

### 7. MongoDB (si utilisé)

#### `MONGODB_URI`
```
mongodb://user:password@host:port/database
```
- **Description** : URL de connexion MongoDB
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Note** : Seulement si vous utilisez MongoDB en plus de PostgreSQL

---

## 🚀 Configuration dans Vercel

### Étapes pour ajouter les variables :

1. **Accéder au Dashboard Vercel**
   - Allez sur https://vercel.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrir les paramètres**
   - Cliquez sur **Settings** → **Environment Variables**

3. **Ajouter les variables**
   - Pour chaque variable :
     - Cliquez sur **Add New**
     - Entrez le **Name** (ex: `DATABASE_URL`)
     - Entrez la **Value** (votre valeur)
     - Sélectionnez les **Environments** (Production, Preview, Development)
     - Cliquez sur **Save**

4. **Redéployer**
   - Après avoir ajouté les variables, redéployez l'application
   - Vercel utilisera automatiquement les nouvelles variables

---

## ✅ Checklist de Déploiement

### Variables Obligatoires
- [ ] `DATABASE_URL` - ✅ Ajoutée
- [ ] `POSTGRES_URL` - ✅ Ajoutée
- [ ] `PRISMA_DATABASE_URL` - ✅ Ajoutée (recommandé)

### Variables Recommandées
- [ ] `ADMIN_USERNAME` - ✅ Ajoutée
- [ ] `ADMIN_PASSWORD` - ✅ Ajoutée
- [ ] `ADMIN_SECURITY_CODE` - ✅ Ajoutée
- [ ] `JWT_SECRET` - ✅ Ajoutée
- [ ] `JWT_EXPIRE` - ✅ Ajoutée
- [ ] `ENCRYPTION_KEY` - ✅ Ajoutée
- [ ] `NODE_ENV` - ✅ Ajoutée (généralement automatique)
- [ ] `NEXT_PUBLIC_APP_URL` - ✅ Ajoutée

### Vérifications Post-Déploiement
- [ ] Test de connexion à la base de données
- [ ] Test de connexion admin
- [ ] Test des routes API
- [ ] Test de la page `/subscription`
- [ ] Test de la page `/admin/premium`

---

## 🔒 Sécurité

### ⚠️ Variables SENSIBLES (ne jamais exposer publiquement)

Ces variables **NE DOIVENT PAS** avoir le préfixe `NEXT_PUBLIC_` :
- `DATABASE_URL`
- `POSTGRES_URL`
- `PRISMA_DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SECURITY_CODE`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `EMAIL_PASS`

### ✅ Variables PUBLIQUES (peuvent être exposées)

Ces variables peuvent avoir le préfixe `NEXT_PUBLIC_` :
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`

---

## 📝 Notes Importantes

1. **Prisma utilise `DATABASE_URL`** : Le schéma Prisma utilise `env("DATABASE_URL")`, donc cette variable est **obligatoire**.

2. **Connection Pooling** : `PRISMA_DATABASE_URL` avec Accelerate est recommandé pour la production car il utilise le connection pooling, ce qui améliore les performances.

3. **Migration** : Après avoir configuré les variables, vous devrez exécuter les migrations Prisma :
   ```bash
   npm run db:migrate:deploy
   ```

4. **Redéploiement** : Après avoir ajouté/modifié des variables d'environnement, redéployez l'application pour que les changements prennent effet.

---

## 🆘 En cas de problème

### Erreur "Environment variable not found"
- Vérifiez que la variable est bien ajoutée dans Vercel
- Vérifiez que les environnements sont correctement sélectionnés
- Redéployez l'application

### Erreur de connexion à la base de données
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que la base de données est accessible depuis Vercel
- Vérifiez que `sslmode=require` est présent dans l'URL

### Erreur "Prisma Client not generated"
- Exécutez `npm run db:generate` localement
- Vérifiez que les migrations sont à jour : `npm run db:migrate:deploy`

---

**Document créé le 06/12/2025**

