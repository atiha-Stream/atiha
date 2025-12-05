# Tests Critiques - Authentification et Sessions

Ce dossier contient les tests critiques pour l'authentification et la gestion des sessions de l'application Atiha.

## Fichiers de tests

### 1. `lib/user-database.test.ts`
Tests pour la base de données utilisateurs :
- ✅ Inscription d'utilisateurs (`registerUser`)
- ✅ Connexion d'utilisateurs (`loginUser`)
- ✅ Validation des données (email, nom, téléphone)
- ✅ Protection XSS (sanitisation)
- ✅ Gestion des utilisateurs bannis/inactifs
- ✅ Hachage des mots de passe avec bcrypt

### 2. `lib/session-manager.test.ts`
Tests pour la gestion des sessions :
- ✅ Validation des connexions (`validateLogin`)
- ✅ Ajout de sessions (`addSession`)
- ✅ Suppression de sessions (`removeSession`)
- ✅ Limite d'appareils (1 pour individuel, 5 pour famille)
- ✅ Reconnexion depuis le même appareil
- ✅ Gestion des sessions actives

### 3. `lib/admin-security.test.ts`
Tests pour l'authentification admin :
- ✅ Authentification admin (`authenticate`)
- ✅ Protection contre les attaques par force brute
- ✅ Verrouillage de compte après tentatives échouées
- ✅ Logs de sécurité
- ✅ Migration automatique des mots de passe en clair vers bcrypt

### 4. `lib/auth-integration.test.ts`
Tests d'intégration end-to-end :
- ✅ Flux complet d'inscription et connexion
- ✅ Flux de session avec limite d'appareils
- ✅ Scénarios famille (5 appareils)
- ✅ Déconnexion et reconnexion
- ✅ Protection contre les attaques XSS

## Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm run test:watch

# Exécuter les tests avec couverture de code
npm run test:coverage

# Exécuter un fichier de test spécifique
npm test -- user-database.test.ts
```

## Couverture cible

- **Branches**: 50%
- **Fonctions**: 50%
- **Lignes**: 50%
- **Statements**: 50%

## Notes importantes

1. Les tests utilisent un mock de `SecureStorage` pour simuler le stockage chiffré
2. Chaque test nettoie `localStorage` avant l'exécution pour garantir l'isolation
3. Les mots de passe sont hachés avec bcrypt dans les tests réels
4. Les tests vérifient la sécurité (XSS, validation, limites)

## Tests critiques couverts

✅ **Authentification utilisateur**
- Inscription avec validation
- Connexion avec vérification de mot de passe
- Gestion des erreurs (email invalide, mot de passe incorrect, compte banni/inactif)

✅ **Gestion des sessions**
- Limite d'appareils (individuel: 1, famille: 5)
- Validation des connexions
- Ajout/suppression de sessions
- Reconnexion depuis le même appareil

✅ **Sécurité admin**
- Authentification admin
- Protection contre les attaques par force brute
- Verrouillage de compte
- Logs de sécurité

✅ **Intégration**
- Flux complets d'authentification
- Scénarios réels d'utilisation
- Protection contre les attaques

