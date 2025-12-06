# Guide : Créer un utilisateur de test en production

## Prérequis

Pour créer un utilisateur de test dans la base de données de production, vous devez avoir les variables d'environnement de production configurées localement.

## Étape 1 : Configurer les variables d'environnement

Ajoutez les variables d'environnement de production dans votre fichier `.env.local` :

```env
# Base de données de production
DATABASE_URL=postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require
PRISMA_DATABASE_URL=postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require
POSTGRES_URL=postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require
```

**⚠️ Important** : Remplacez les valeurs ci-dessus par vos vraies variables d'environnement de production depuis Vercel.

## Étape 2 : Exécuter le script

Exécutez la commande suivante :

```bash
npm run create:test-user:production
```

## Étape 3 : Identifiants de connexion

Le script créera un utilisateur avec les identifiants suivants :

- **Email** : `test@atiha.com`
- **Mot de passe** : `Test1234!`
- **Nom** : `Utilisateur Test`

## Étape 4 : Se connecter

1. Allez sur `https://atiha.vercel.app/login`
2. Entrez l'email : `test@atiha.com`
3. Entrez le mot de passe : `Test1234!`
4. Cliquez sur "Se connecter"

## ⚠️ Sécurité

**Important** : Changez le mot de passe après la première connexion pour des raisons de sécurité !

## Dépannage

### Le script ne se connecte pas à la base de données

Vérifiez que :
1. Les variables d'environnement sont correctement configurées dans `.env.local`
2. Les variables d'environnement correspondent à celles de Vercel
3. La base de données est accessible depuis votre machine

### L'utilisateur existe déjà

Si l'utilisateur existe déjà, le script vous informera. Vous pouvez :
- Utiliser les identifiants existants
- Supprimer l'utilisateur et le recréer
- Modifier le script pour utiliser un autre email

