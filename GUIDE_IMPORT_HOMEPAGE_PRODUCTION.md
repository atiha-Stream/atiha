# Guide : Importer les données HomepageEditor en production

## Problème

Les données HomepageEditor sont visibles en local mais pas en production. Cela signifie que les données n'ont pas été importées dans la base de données de production (Vercel Postgres).

## Solution

### Option 1 : Importer via script (recommandé)

1. **Configurer les variables d'environnement de production**

   Assurez-vous d'avoir les variables d'environnement de production configurées localement :
   - `DATABASE_URL` : URL de connexion à la base de données de production
   - `PRISMA_DATABASE_URL` : URL Prisma de la base de données de production

   Vous pouvez les obtenir depuis le dashboard Vercel :
   - Allez dans votre projet Vercel
   - Settings → Environment Variables
   - Copiez `DATABASE_URL` et `PRISMA_DATABASE_URL`

2. **Créer un fichier `.env.production` localement** (optionnel, pour ne pas écraser vos variables locales)

   ```bash
   DATABASE_URL="postgresql://..."
   PRISMA_DATABASE_URL="postgresql://..."
   ```

3. **Exécuter le script d'import**

   ```bash
   # Avec les variables d'environnement de production
   DATABASE_URL="votre_url_production" npm run import:homepage:production
   
   # Ou si vous avez un fichier .env.production
   # Chargez les variables puis exécutez
   npm run import:homepage:production
   ```

### Option 2 : Importer via Vercel CLI

1. **Installer Vercel CLI** (si ce n'est pas déjà fait)

   ```bash
   npm i -g vercel
   ```

2. **Se connecter à Vercel**

   ```bash
   vercel login
   ```

3. **Lier le projet**

   ```bash
   vercel link
   ```

4. **Exécuter le script avec les variables d'environnement de production**

   ```bash
   vercel env pull .env.production
   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) \
   PRISMA_DATABASE_URL=$(grep PRISMA_DATABASE_URL .env.production | cut -d '=' -f2) \
   npm run import:homepage:production
   ```

### Option 3 : Importer via SQL direct (avancé)

Si vous avez accès direct à la base de données PostgreSQL de production, vous pouvez exécuter une requête SQL pour insérer les données.

1. **Exporter les données depuis la base locale**

   ```bash
   npm run verify:homepage
   ```

2. **Copier les données JSON**

3. **Insérer dans la base de production via un client SQL ou Prisma Studio**

## Vérification

Après l'import, vérifiez que les données sont bien présentes :

### 1. Tester l'API en production

```bash
npm run test:api:homepage:production
```

### 2. Vérifier dans l'application

1. Allez sur votre site de production
2. Ouvrez la console du navigateur (F12)
3. Vérifiez qu'il n'y a pas d'erreurs
4. Les données devraient être chargées depuis l'API

### 3. Vérifier les logs Vercel

1. Allez dans le dashboard Vercel
2. Ouvrez l'onglet "Logs"
3. Vérifiez qu'il n'y a pas d'erreurs liées à `/api/homepage-editor`

## Dépannage

### Erreur : "Can't reach database"

- Vérifiez que les variables d'environnement `DATABASE_URL` sont correctes
- Vérifiez que la base de données est accessible depuis votre machine
- Vérifiez que les credentials sont corrects

### Erreur : "Repository not found" ou erreur de connexion

- Vérifiez que vous utilisez les bonnes variables d'environnement de production
- Vérifiez que la base de données Vercel Postgres est active

### Les données ne s'affichent toujours pas

1. **Vider le cache du navigateur**
   - Ouvrez les outils de développement (F12)
   - Clic droit sur le bouton de rechargement
   - Sélectionnez "Vider le cache et effectuer une actualisation forcée"

2. **Vérifier que l'API fonctionne**
   ```bash
   curl https://votre-domaine.vercel.app/api/homepage-editor
   ```

3. **Vérifier les logs de l'application**
   - Regardez la console du navigateur pour les erreurs
   - Vérifiez les logs Vercel pour les erreurs serveur

## Notes importantes

- ⚠️ **Attention** : Le script d'import en production modifie directement la base de données de production
- ✅ Les données importées remplaceront les données existantes si un enregistrement actif existe déjà
- 🔄 Après l'import, l'application devrait automatiquement charger les nouvelles données au prochain chargement de page

