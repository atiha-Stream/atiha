# ✅ Implémentation de la Synchronisation Bidirectionnelle localStorage ↔ PostgreSQL

**Date :** 2025-01-06  
**Statut :** ✅ Implémenté (Phase 1)

---

## 📋 Résumé

La synchronisation bidirectionnelle automatique entre localStorage et PostgreSQL a été implémentée pour les données utilisateurs critiques :

- ✅ **Historique de visionnage** (WatchHistory)
- ✅ **Liste de souhaits** (Watchlist)
- ⚠️ **Favoris** (à compléter)
- ⚠️ **Notes et avis** (à compléter)

---

## 🏗️ Architecture

### Service de Synchronisation Générique (`SyncService`)

**Fichier :** `src/lib/sync-service.ts`

**Fonctionnalités :**
1. **Chargement** : PostgreSQL (via API) → Cache localStorage
2. **Sauvegarde** : localStorage immédiat → Sync PostgreSQL en arrière-plan
3. **Mode offline** : Queue des modifications → Sync au retour en ligne
4. **Synchronisation périodique** : Toutes les 30 secondes

**Méthodes principales :**
- `load<T>(config)` : Charger depuis PostgreSQL avec fallback localStorage
- `save<T>(config, data, operation?)` : Sauvegarder avec sync en arrière-plan
- `createOperation(type, endpoint, data)` : Créer une opération de sync
- `startPeriodicSync(config)` : Démarrer la synchronisation périodique
- `processSyncQueue()` : Traiter la queue de synchronisation

---

## 🔄 Stratégie de Synchronisation

### 1. Au Chargement des Données

```typescript
// 1. Essayer PostgreSQL via API
const data = await SyncService.load({
  cacheKey: 'watch_history_user123',
  apiEndpoint: '/api/users/123/watch-history'
})

// 2. Si erreur → Fallback localStorage
// 3. Mettre à jour le cache localStorage
// 4. Retourner les données
```

### 2. Lors d'une Modification

```typescript
// 1. Sauvegarder immédiatement dans localStorage (UX rapide)
localStorage.setItem(key, JSON.stringify(data))

// 2. Créer une opération de synchronisation
const operation = SyncService.createOperation(
  'create',
  '/api/users/123/watch-history',
  { contentId, contentType, progress }
)

// 3. Synchroniser en arrière-plan
await SyncService.save(config, data, operation)
```

### 3. Mode Offline

```typescript
// Si offline → Ajouter à la queue
if (!navigator.onLine) {
  SyncService.addToQueue(operation)
}

// Au retour en ligne → Traiter la queue
window.addEventListener('online', () => {
  SyncService.processSyncQueue()
})
```

### 4. Synchronisation Périodique

```typescript
// Démarrer la synchronisation toutes les 30 secondes
SyncService.startPeriodicSync({
  cacheKey: 'watch_history_user123',
  apiEndpoint: '/api/users/123/watch-history',
  syncInterval: 30000
})
```

---

## 📝 Modifications Apportées

### 1. Service de Synchronisation (`src/lib/sync-service.ts`)

**Nouveau fichier créé** avec :
- ✅ Gestion du cache localStorage
- ✅ Synchronisation avec PostgreSQL via API routes
- ✅ Queue pour les opérations en mode offline
- ✅ Synchronisation périodique automatique
- ✅ Gestion des erreurs et retry

### 2. API Routes pour les Notes (`src/app/api/users/[id]/ratings/route.ts`)

**Nouveau fichier créé** avec :
- ✅ `GET /api/users/[id]/ratings` : Récupérer les notes
- ✅ `POST /api/users/[id]/ratings` : Ajouter/mettre à jour une note
- ✅ `DELETE /api/users/[id]/ratings` : Supprimer une note
- ✅ Validation de la note (1-5)
- ✅ Authentification et autorisation
- ✅ Gestion des erreurs avec fallback

### 3. UserProfileService (`src/lib/user-profile-service.ts`)

**Méthodes modifiées :**

#### `addToWatchHistory()`
- ✅ Sauvegarde immédiate dans localStorage
- ✅ Synchronisation en arrière-plan vers PostgreSQL
- ✅ Gestion des erreurs avec fallback

#### `getWatchHistory()`
- ✅ Chargement depuis PostgreSQL avec cache
- ✅ Fallback vers localStorage si erreur
- ✅ Mise à jour automatique du profil local

#### `addToWatchlist()`
- ✅ Sauvegarde immédiate dans localStorage
- ✅ Synchronisation en arrière-plan vers PostgreSQL
- ✅ Gestion des erreurs avec fallback

#### `removeFromWatchlist()`
- ✅ Suppression immédiate dans localStorage
- ✅ Synchronisation en arrière-plan vers PostgreSQL
- ✅ Gestion des erreurs avec fallback

#### `getWatchlist()`
- ✅ Chargement depuis PostgreSQL avec cache
- ✅ Fallback vers localStorage si erreur
- ✅ Mise à jour automatique du profil local

#### `addFavorite()`
- ✅ Synchronisation en arrière-plan vers PostgreSQL
- ✅ Vérification des doublons
- ✅ Gestion des erreurs avec queue

#### `removeFavorite()`
- ✅ Synchronisation en arrière-plan vers PostgreSQL
- ✅ Gestion des erreurs avec queue

#### `getFavorites()`
- ✅ Chargement depuis PostgreSQL avec cache
- ✅ Fallback vers localStorage si erreur
- ✅ Conversion automatique du format Prisma

#### `isFavorite()`
- ✅ Vérification via `getFavorites()` (synchronisé)

#### `addRating()`
- ✅ Sauvegarde immédiate dans localStorage
- ✅ Synchronisation en arrière-plan vers PostgreSQL
- ✅ Validation de la note (1-5)
- ✅ Gestion des erreurs avec fallback

#### `removeRating()`
- ✅ Suppression immédiate dans localStorage
- ✅ Synchronisation en arrière-plan vers PostgreSQL
- ✅ Gestion des erreurs avec fallback

#### `getRatings()`
- ✅ Chargement depuis PostgreSQL avec cache
- ✅ Fallback vers localStorage si erreur
- ✅ Conversion automatique du format Prisma
- ✅ Mise à jour automatique du profil local

---

## 🎯 Fonctionnalités Implémentées

### ✅ Synchronisation Bidirectionnelle

- **PostgreSQL → localStorage** : Au chargement, les données sont chargées depuis PostgreSQL et mises en cache dans localStorage
- **localStorage → PostgreSQL** : Lors d'une modification, les données sont sauvegardées dans localStorage immédiatement, puis synchronisées avec PostgreSQL en arrière-plan

### ✅ Mode Offline

- Les modifications sont mises en queue lorsque l'application est hors ligne
- La queue est traitée automatiquement au retour en ligne
- Les données restent disponibles depuis localStorage même en mode offline

### ✅ Synchronisation Périodique

- Synchronisation automatique toutes les 30 secondes
- Garantit que les données sont à jour même si l'utilisateur n'a pas fait de modifications

### ✅ Gestion des Erreurs

- Fallback automatique vers localStorage en cas d'erreur
- Retry automatique pour les opérations échouées (max 3 tentatives)
- Logging des erreurs pour le débogage

---

## 📊 Données Synchronisées

| Type de Données | localStorage | PostgreSQL | Synchronisation | Statut |
|----------------|--------------|------------|-----------------|--------|
| **WatchHistory** | ✅ Cache | ✅ Principal | ✅ Bidirectionnelle | ✅ Implémenté |
| **Watchlist** | ✅ Cache | ✅ Principal | ✅ Bidirectionnelle | ✅ Implémenté |
| **Favorites** | ✅ Cache | ✅ Principal | ✅ Bidirectionnelle | ✅ Implémenté |
| **Ratings** | ✅ Cache | ✅ Principal | ✅ Bidirectionnelle | ✅ Implémenté |
| **UserProfile** | ✅ Cache | ⚠️ Partiel | ⚠️ À implémenter | ⚠️ En attente |

---

## 🔧 Prochaines Étapes

### Phase 2 : Compléter les Données Restantes

1. ✅ **Favoris** (`addFavorite`, `removeFavorite`, `getFavorites`)
   - ✅ Utiliser `/api/users/[id]/favorites`
   - ✅ Synchronisation bidirectionnelle implémentée

2. ✅ **Notes et Avis** (`addRating`, `removeRating`, `getRatings`)
   - ✅ API routes créées : `/api/users/[id]/ratings` (GET, POST, DELETE)
   - ✅ Synchronisation bidirectionnelle complète implémentée
   - ✅ Validation de la note (1-5)
   - ✅ Gestion des erreurs avec fallback

3. **Profil Utilisateur** (`getUserProfile`, `updateUserProfile`)
   - Utiliser `/api/users/[id]`
   - Implémenter la synchronisation bidirectionnelle

### Phase 3 : UserDatabase

1. **Utilisateurs** (`registerUser`, `findUserByEmail`, etc.)
   - Utiliser `/api/users`
   - Implémenter la synchronisation bidirectionnelle

---

## 🧪 Tests à Effectuer

### 1. Test de Synchronisation Basique

```typescript
// 1. Ajouter un élément à l'historique
await UserProfileService.addToWatchHistory(userId, contentId, 'movie', 'Test Movie')

// 2. Vérifier dans localStorage
const cached = localStorage.getItem('atiha_watch_history_user123')
expect(cached).toBeTruthy()

// 3. Vérifier dans PostgreSQL (via API)
const response = await fetch('/api/users/123/watch-history')
const data = await response.json()
expect(data.history).toContainEqual(expect.objectContaining({ contentId }))
```

### 2. Test Mode Offline

```typescript
// 1. Simuler mode offline
navigator.onLine = false

// 2. Ajouter un élément
await UserProfileService.addToWatchHistory(userId, contentId, 'movie', 'Test Movie')

// 3. Vérifier que l'opération est en queue
const queue = JSON.parse(localStorage.getItem('atiha_sync_queue') || '[]')
expect(queue.length).toBeGreaterThan(0)

// 4. Simuler retour en ligne
navigator.onLine = true
window.dispatchEvent(new Event('online'))

// 5. Vérifier que la queue est traitée
await new Promise(resolve => setTimeout(resolve, 1000))
const queueAfter = JSON.parse(localStorage.getItem('atiha_sync_queue') || '[]')
expect(queueAfter.length).toBe(0)
```

### 3. Test de Synchronisation Périodique

```typescript
// 1. Démarrer la synchronisation périodique
SyncService.startPeriodicSync({
  cacheKey: 'test_sync',
  apiEndpoint: '/api/users/123/watch-history',
  syncInterval: 5000 // 5 secondes pour le test
})

// 2. Attendre 6 secondes
await new Promise(resolve => setTimeout(resolve, 6000))

// 3. Vérifier que les données ont été synchronisées
const lastSync = JSON.parse(localStorage.getItem('atiha_last_sync') || '{}')
expect(lastSync['test_sync']).toBeDefined()
```

---

## 📚 Documentation Technique

### Utilisation de SyncService

```typescript
import SyncService from '@/lib/sync-service'

// Charger des données
const data = await SyncService.load({
  cacheKey: 'my_cache_key',
  apiEndpoint: '/api/my-endpoint',
  syncInterval: 30000 // optionnel
})

// Sauvegarder des données
await SyncService.save({
  cacheKey: 'my_cache_key',
  apiEndpoint: '/api/my-endpoint'
}, data, operation)

// Démarrer la synchronisation périodique
SyncService.startPeriodicSync({
  cacheKey: 'my_cache_key',
  apiEndpoint: '/api/my-endpoint',
  syncInterval: 30000
})
```

### Utilisation de UserProfileService (avec sync)

```typescript
import { UserProfileService } from '@/lib/user-profile-service'

// Ajouter à l'historique (sync automatique)
await UserProfileService.addToWatchHistory(
  userId,
  contentId,
  'movie',
  'Movie Title'
)

// Charger l'historique (sync automatique)
const history = await UserProfileService.getWatchHistory(userId, 50)

// Ajouter à la watchlist (sync automatique)
await UserProfileService.addToWatchlist(
  userId,
  contentId,
  'movie',
  'Movie Title'
)
```

---

## ⚠️ Notes Importantes

1. **Performance** : La synchronisation se fait en arrière-plan pour ne pas bloquer l'UI
2. **Résilience** : Les données restent disponibles même en cas d'erreur de synchronisation
3. **Conflits** : Stratégie "Last Write Wins" (dernière modification gagne)
4. **Sécurité** : Les API routes vérifient l'authentification avant de synchroniser

---

## 🎉 Résultat

L'application dispose maintenant d'une **synchronisation bidirectionnelle automatique** entre localStorage et PostgreSQL pour :
- ✅ L'historique de visionnage
- ✅ La liste de souhaits
- ✅ Les favoris
- ✅ Les notes et avis

Les utilisateurs peuvent maintenant :
- ✅ Accéder à leurs données sur plusieurs appareils
- ✅ Utiliser l'application en mode offline
- ✅ Bénéficier d'une UX rapide (localStorage immédiat)
- ✅ Avoir leurs données sauvegardées de manière centralisée (PostgreSQL)

---

**Prochaine étape (optionnel) :** 
- ⚠️ Implémenter la synchronisation pour le profil utilisateur complet (`UserProfile`)
- ⚠️ Implémenter la synchronisation pour `UserDatabase` (utilisateurs)

