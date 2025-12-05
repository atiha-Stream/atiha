# 🔄 Guide de Migration vers le Logger Centralisé

## 📋 Objectif

Remplacer progressivement tous les `console.log`, `console.error`, `console.warn`, `console.debug` par le nouveau système de logging centralisé (`src/lib/logger.ts`).

## ✅ Fichiers Déjà Migrés

- ✅ `src/lib/error-logger.ts` - Utilise maintenant `logger`
- ✅ `src/lib/admin-security.ts` - Utilise maintenant `logger`
- ✅ `src/components/SecureStorageInitializer.tsx` - Utilise maintenant `logger`

## 🔧 Comment Migrer

### 1. Importer le Logger

```typescript
import { logger } from '@/lib/logger'
// ou
import logger from '@/lib/logger'
```

### 2. Remplacer les Appels

#### console.log → logger.info ou logger.debug

```typescript
// ❌ Avant
console.log('User logged in:', user)

// ✅ Après
logger.info('User logged in', { user })
```

#### console.error → logger.error

```typescript
// ❌ Avant
console.error('Failed to load data:', error)

// ✅ Après
logger.error('Failed to load data', error)
```

#### console.warn → logger.warn

```typescript
// ❌ Avant
console.warn('Deprecated function used')

// ✅ Après
logger.warn('Deprecated function used')
```

#### console.debug → logger.debug

```typescript
// ❌ Avant
console.debug('Debug info:', data)

// ✅ Après
logger.debug('Debug info', data)
```

### 3. Cas Spéciaux

#### Erreurs Critiques

```typescript
// ❌ Avant
console.error('🚨 CRITICAL:', error)

// ✅ Après
logger.critical('CRITICAL ERROR', error, { context })
```

#### Groupes de Logs

```typescript
// ❌ Avant
console.group('User Actions')
console.log('Action 1')
console.log('Action 2')
console.groupEnd()

// ✅ Après
logger.group('User Actions')
logger.info('Action 1')
logger.info('Action 2')
logger.groupEnd()
```

## 📊 Statistiques

- **Total console.log trouvés:** ~533 occurrences
- **Fichiers à migrer:** ~108 fichiers
- **Priorité:** Fichiers critiques d'abord (lib/, components/)

## 🎯 Plan de Migration

### Phase 1: Services Critiques (FAIT ✅)
- [x] `src/lib/error-logger.ts`
- [x] `src/lib/admin-security.ts`
- [x] `src/components/SecureStorageInitializer.tsx`

### Phase 2: Autres Services (À FAIRE)
- [ ] `src/lib/auth-context.tsx`
- [ ] `src/lib/admin-auth-context.tsx`
- [ ] `src/lib/content-service.ts`
- [ ] `src/lib/user-database.ts`
- [ ] `src/lib/secure-storage.ts`

### Phase 3: Composants (À FAIRE)
- [ ] `src/components/HomepageEditor.tsx`
- [ ] `src/components/VideoPlayer.tsx`
- [ ] `src/components/DataManagement.tsx`

### Phase 4: Pages (À FAIRE)
- [ ] `src/app/dashboard/page.tsx`
- [ ] `src/app/admin/**/*.tsx`

## ⚠️ Notes Importantes

1. **En Production:** Les logs `debug` et `info` sont automatiquement ignorés
2. **Context:** Toujours passer un objet de contexte pour les logs importants
3. **Erreurs:** Toujours passer l'erreur comme deuxième paramètre pour `logger.error()`
4. **Performance:** Le logger vérifie le niveau avant de formater le message

## 🔍 Recherche des Fichiers à Migrer

Pour trouver tous les fichiers avec console.log:

```bash
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l
```

Pour lister les fichiers:

```bash
grep -r "console\." src/ --include="*.ts" --include="*.tsx" -l
```

