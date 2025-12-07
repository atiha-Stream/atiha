# Guide : Vérifier et créer les utilisateurs dans la base de données de production

## Problème

Les connexions admin et user échouent car les utilisateurs/admins n'existent probablement pas dans la base de données de production, ou Prisma ne peut pas s'y connecter.

## Solution 1 : Vérifier via Prisma Studio (Recommandé)

1. **Lancer Prisma Studio pour la production :**
   ```bash
   npm run db:studio:production
   ```

2. **Vérifier les tables :**
   - Ouvrir la table `users` et vérifier si `leGenny@atiha.com` existe
   - Ouvrir la table `admins` et vérifier si `leGenny` existe

3. **Si les utilisateurs n'existent pas :**
   - Créer manuellement via Prisma Studio, ou
   - Utiliser le script ci-dessous

## Solution 2 : Créer les utilisateurs via script

1. **Configurer DATABASE_URL localement :**
   - Copier la `DATABASE_URL` depuis Vercel (Settings → Environment Variables)
   - La définir dans votre terminal PowerShell :
   ```powershell
   $env:DATABASE_URL = "postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require"
   ```

2. **Exécuter le script de création :**
   ```bash
   npm run create:initial-users:production
   ```

## Solution 3 : Vérifier les logs Vercel

1. **Aller sur Vercel → Votre projet → Logs**
2. **Tenter une connexion** (admin ou user)
3. **Vérifier les logs** pour voir :
   - Si Prisma peut se connecter à la base de données
   - Si les utilisateurs sont trouvés
   - Les erreurs exactes

## Identifiants à créer

### Utilisateur
- **Email :** `leGenny@atiha.com`
- **Nom :** `leGenny`
- **Mot de passe :** `Atiasekbaby@89#2025!`
- **Hash bcrypt requis**

### Admin
- **Username :** `leGenny`
- **Email :** `leGenny@atiha.com`
- **Mot de passe :** `Atiasekbaby@89#2025!`
- **Rôle :** `super_admin`
- **Hash bcrypt requis**

## Vérification après création

1. **Tester la connexion admin :**
   - Aller sur `https://attiha.vercel.app/admin/login`
   - Utiliser : `leGenny` / `Atiasekbaby@89#2025!`

2. **Tester la connexion user :**
   - Aller sur `https://attiha.vercel.app/login`
   - Utiliser : `leGenny@atiha.com` / `Atiasekbaby@89#2025!`

## Si Prisma ne peut pas se connecter

Si vous voyez l'erreur `Can't reach database server at db.prisma.io:5432` :

1. **Vérifier DATABASE_URL sur Vercel :**
   - Aller dans Settings → Environment Variables
   - Vérifier que `DATABASE_URL` est bien définie
   - Vérifier que `POSTGRES_URL` est bien définie

2. **Vérifier que PRISMA_DATABASE_URL n'est pas définie :**
   - Si elle existe et commence par `prisma+postgres://`, la supprimer
   - Elle interfère avec la connexion Prisma

3. **Redéployer le projet :**
   - Après modification des variables d'environnement, redéployer

