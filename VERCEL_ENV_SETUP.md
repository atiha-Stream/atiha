# 🔧 Configuration des Variables d'Environnement pour Vercel

## 📋 Variables à configurer dans Vercel

Ajoutez ces variables dans votre projet Vercel :

### 1. Accéder aux paramètres du projet
- Allez sur https://vercel.com/dashboard
- Sélectionnez votre projet `stream`
- Cliquez sur **Settings** → **Environment Variables**

### 2. Ajouter les variables suivantes

#### DATABASE_URL
```
postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require
```
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Description** : URL de connexion directe PostgreSQL pour Prisma

#### POSTGRES_URL
```
postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require
```
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Description** : URL PostgreSQL (identique à DATABASE_URL)

#### PRISMA_DATABASE_URL
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19kMDFtMFpZX3U2d2pJMTE5emxwY0giLCJhcGlfa2V5IjoiMDFLQlBKSE5IOEhQRTM3UFpBMU5RQkJBN1QiLCJ0ZW5hbnRfaWQiOiIxNGQ0YmU0OWNlYjI4OTRlODRiZGQyYTE1ZmIzZDQzMDdlYWUwMGQ0YmQ4NjFjMmViY2ZjODFkZmUyYjY1ZDc2IiwiaW50ZXJuYWxfc2VjcmV0IjoiNzZlYTZiZGMtNzkxMi00NGVjLWIzYzMtODIyOWMxZmYxOWU5In0.azeiGYD80jWbc_WszyB1FVR5pazSg1lGwg67NA3jQHE
```
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development
- **Description** : URL Prisma avec Accelerate (connection pooling - recommandé pour la production)

## 🚀 Configuration Locale

Pour le développement local, créez un fichier `.env.local` à la racine du projet :

```bash
# .env.local
DATABASE_URL="postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL="postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require"
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19kMDFtMFpZX3U2d2pJMTE5emxwY0giLCJhcGlfa2V5IjoiMDFLQlBKSE5IOEhQRTM3UFpBMU5RQkJBN1QiLCJ0ZW5hbnRfaWQiOiIxNGQ0YmU0OWNlYjI4OTRlODRiZGQyYTE1ZmIzZDQzMDdlYWUwMGQ0YmQ4NjFjMmViY2ZjODFkZmUyYjY1ZDc2IiwiaW50ZXJuYWxfc2VjcmV0IjoiNzZlYTZiZGMtNzkxMi00NGVjLWIzYzMtODIyOWMxZmYxOWU5In0.azeiGYD80jWbc_WszyB1FVR5pazSg1lGwg67NA3jQHE"
```

⚠️ **Important** : Le fichier `.env.local` est déjà dans `.gitignore` et ne sera pas commité.

## 📝 Notes Importantes

1. **Prisma utilise `DATABASE_URL`** : Le schéma Prisma (`prisma/schema.prisma`) utilise `env("DATABASE_URL")`, donc cette variable est obligatoire.

2. **PRISMA_DATABASE_URL** : Cette URL avec Accelerate est optimale pour la production car elle utilise le connection pooling. Vous pouvez l'utiliser en remplaçant `DATABASE_URL` par `PRISMA_DATABASE_URL` dans le schéma Prisma si vous le souhaitez.

3. **Sécurité** : Ne partagez jamais ces URLs publiquement. Elles contiennent des credentials sensibles.

4. **Migration** : Après avoir configuré les variables, vous devrez exécuter les migrations Prisma :
   ```bash
   npm run db:migrate:deploy
   ```

## ✅ Checklist

- [ ] Variables ajoutées dans Vercel Dashboard
- [ ] `.env.local` créé pour le développement local
- [ ] Migrations Prisma exécutées
- [ ] Test de connexion à la base de données réussi

