# 🧪 Configuration des Tests

## Installation des dépendances

Exécutez les commandes suivantes pour installer les dépendances de test :

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

## Structure des tests

Les tests sont organisés dans `src/__tests__/` :

```
src/
├── __tests__/
│   └── lib/
│       ├── encryption-service.test.ts
│       ├── input-validation.test.ts
│       └── input-validation-service.test.ts
├── lib/
│   ├── encryption-service.ts
│   ├── input-validation.ts
│   └── ...
```

## Commandes disponibles

### Exécuter tous les tests
```bash
npm test
```

### Mode watch (réexécution automatique)
```bash
npm run test:watch
```

### Avec couverture de code
```bash
npm run test:coverage
```

## Tests implémentés

### ✅ Input Validation (`input-validation.test.ts`)
- Sanitization XSS
- Validation d'URLs
- Validation de mots de passe forts
- Nettoyage HTML

### ✅ Encryption Service (`encryption-service.test.ts`)
- Hachage de mots de passe (bcrypt)
- Vérification de mots de passe
- Chiffrement/déchiffrement de données (AES-256)
- Gestion des objets complexes

## Prochaines étapes

Pour ajouter plus de tests :

1. **Composants React** : Créer `src/__tests__/components/`
2. **API Routes** : Créer `src/__tests__/app/api/`
3. **Hooks** : Créer `src/__tests__/hooks/`

## Configuration

- **Jest Config** : `jest.config.js`
- **Setup** : `jest.setup.js` (mocks Next.js, localStorage, etc.)

## Coverage

Objectif de couverture minimale : 50% (configuré dans `jest.config.js`)

Pour augmenter la couverture, ajoutez plus de tests pour :
- Les composants critiques
- Les services métier
- Les fonctions utilitaires

