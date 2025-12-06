# Configuration de la Base de Données sur Vercel

## Problème

L'application fonctionne en local mais retourne des erreurs 500 sur `/api/homepage-editor` en production avec le message :
```
prisma:error Invalid prisma.homepageEditor.findFirst() invocation: Error validating datasource 'db': the URL must sta...
```

## Solution

### 1. Vérifier les Variables d'Environnement sur Vercel

Assurez-vous que les variables suivantes sont définies dans Vercel :

1. Allez sur https://vercel.com
2. Sélectionnez votre projet `atiha`
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que les variables suivantes sont définies :

#### Variables OBLIGATOIRES :

- **`DATABASE_URL`** : URL de connexion PostgreSQL principale
  - Format : `postgresql://user:password@host:port/database?sslmode=require`
  - Cette variable est utilisée par Prisma

- **`POSTGRES_URL`** : URL PostgreSQL alternative (optionnelle mais recommandée)
  - Format : `postgresql://user:password@host:port/database?sslmode=require`

- **`PRISMA_DATABASE_URL`** : URL spécifique pour Prisma (optionnelle mais recommandée)
  - Format : `postgresql://user:password@host:port/database?sslmode=require`
  - Si cette variable est définie, elle sera utilisée en priorité

### 2. Comment Récupérer les Variables depuis Vercel Postgres

1. Allez sur https://vercel.com
2. Sélectionnez votre projet
3. Allez dans **Storage** → **Postgres**
4. Sélectionnez votre base de données
5. Allez dans l'onglet **.env.local**
6. Copiez les variables suivantes :
   - `POSTGRES_URL`
   - `POSTGRES_URL_NON_POOLING` (pour Prisma)
   - `DATABASE_URL` (si disponible)

### 3. Configuration Recommandée

Pour Vercel Postgres, utilisez :

- **`DATABASE_URL`** = `POSTGRES_URL_NON_POOLING` (pour Prisma)
- **`POSTGRES_URL`** = `POSTGRES_URL` (pour les connexions directes)
- **`PRISMA_DATABASE_URL`** = `POSTGRES_URL_NON_POOLING` (optionnel, sera utilisé automatiquement)

### 4. Vérification

Après avoir ajouté les variables :

1. **Redéployez l'application** sur Vercel
2. Vérifiez les logs pour confirmer qu'il n'y a plus d'erreurs Prisma
3. Testez l'API : `https://atiha.vercel.app/api/homepage-editor`

### 5. Format de l'URL

L'URL doit être au format :
```
postgresql://user:password@host:port/database?sslmode=require
```

**Important** : 
- L'URL doit commencer par `postgresql://` ou `postgres://`
- Le paramètre `?sslmode=require` est généralement nécessaire pour Vercel Postgres
- Ne pas inclure d'espaces ou de caractères spéciaux non encodés

### 6. Dépannage

Si l'erreur persiste :

1. **Vérifiez que les variables sont définies pour tous les environnements** :
   - Production
   - Preview
   - Development

2. **Vérifiez le format de l'URL** :
   - L'URL doit être complète et valide
   - Pas d'espaces ou de caractères spéciaux

3. **Vérifiez les permissions** :
   - La base de données doit être accessible depuis Vercel
   - Les credentials doivent être corrects

4. **Consultez les logs Vercel** :
   - Allez dans **Logs** sur Vercel
   - Recherchez les erreurs Prisma
   - Vérifiez le message d'erreur complet

## Note Technique

Le fichier `src/lib/db-config.ts` configure automatiquement `DATABASE_URL` à partir de `PRISMA_DATABASE_URL` ou `POSTGRES_URL` si `DATABASE_URL` n'est pas définie. Cela permet une flexibilité dans la configuration.

