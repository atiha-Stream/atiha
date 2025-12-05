# 📚 Exemples d'Utilisation des Hooks React

**Date:** 2025-11-22  
**Statut:** ✅ Hooks créés et prêts à l'emploi

---

## 🎯 Hooks Disponibles

- ✅ `useWatchlist` - Gérer la watchlist
- ✅ `useWatchHistory` - Gérer l'historique de visionnage
- ✅ `useFavorites` - Gérer les favoris
- ✅ `useSessions` - Gérer les sessions
- ✅ `useUsers` - Gérer les utilisateurs (admin)
- ✅ `useMigration` - Migrer depuis localStorage

---

## 📖 Exemples d'Utilisation

### 1. useWatchlist

```tsx
import { useWatchlist } from '@/hooks'
import { useAuth } from '@/lib/auth-context'

function MovieCard({ movieId, movieTitle }) {
  const { user } = useAuth()
  const { watchlist, loading, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist(user?.id)

  const handleToggleWatchlist = async () => {
    const isInList = isInWatchlist(movieId, 'movie')
    if (isInList) {
      await removeFromWatchlist(movieId, 'movie')
    } else {
      await addToWatchlist(movieId, 'movie')
    }
  }

  return (
    <div>
      <h3>{movieTitle}</h3>
      <button
        onClick={handleToggleWatchlist}
        disabled={loading}
        className={isInWatchlist(movieId, 'movie') ? 'text-red-500' : ''}
      >
        {isInWatchlist(movieId, 'movie') ? 'Retirer de la liste' : 'Ajouter à la liste'}
      </button>
    </div>
  )
}
```

### 2. useWatchHistory

```tsx
import { useWatchHistory } from '@/hooks'
import { useAuth } from '@/lib/auth-context'
import { useEffect } from 'react'

function VideoPlayer({ videoId, videoType }) {
  const { user } = useAuth()
  const { getProgress, saveProgress } = useWatchHistory(user?.id)

  // Récupérer la progression au chargement
  const progress = getProgress(videoId)
  const savedTime = progress?.progress || 0

  // Sauvegarder la progression toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      const video = document.querySelector('video')
      if (video) {
        saveProgress(
          videoId,
          videoType,
          Math.floor(video.currentTime),
          Math.floor(video.duration),
          video.currentTime >= video.duration * 0.9 // 90% = complété
        )
      }
    }, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [videoId, videoType, saveProgress])

  // Reprendre la lecture où on s'était arrêté
  useEffect(() => {
    if (savedTime > 0) {
      const video = document.querySelector('video')
      if (video) {
        video.currentTime = savedTime
      }
    }
  }, [savedTime])

  return <video src={videoUrl} />
}
```

### 3. useFavorites

```tsx
import { useFavorites } from '@/hooks'
import { useAuth } from '@/lib/auth-context'
import { HeartIcon } from '@heroicons/react/24/solid'

function FavoriteButton({ contentId, contentType }) {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite, loading } = useFavorites(user?.id)

  const handleClick = async () => {
    await toggleFavorite(contentId, contentType)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || !user}
      className={`p-2 rounded-full transition-colors ${
        isFavorite(contentId, contentType)
          ? 'bg-red-500 text-white'
          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
      }`}
    >
      <HeartIcon className="w-5 h-5" />
    </button>
  )
}
```

### 4. useSessions

```tsx
import { useSessions } from '@/hooks'

function SessionsList() {
  const { sessions, loading, deleteSession, refresh } = useSessions()

  if (loading) {
    return <div>Chargement des sessions...</div>
  }

  return (
    <div>
      <h2>Sessions actives</h2>
      <button onClick={refresh}>Actualiser</button>
      
      {sessions.map((session) => (
        <div key={session.id} className="flex justify-between items-center">
          <div>
            <p>Appareil: {session.deviceId}</p>
            <p>Dernière activité: {new Date(session.lastActivity).toLocaleString()}</p>
          </div>
          <button
            onClick={() => deleteSession(session.id)}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Déconnecter
          </button>
        </div>
      ))}
    </div>
  )
}
```

### 5. useUsers (Admin)

```tsx
import { useUsers } from '@/hooks'
import { useState, useEffect } from 'react'

function AdminUsersPage() {
  const { users, loading, error, pagination, fetchUsers, deleteUser } = useUsers()
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchUsers(page, 20)
  }, [page, fetchUsers])

  const handleDelete = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      await deleteUser(userId)
      // Recharger la liste
      fetchUsers(page, 20)
    }
  }

  return (
    <div>
      <h1>Gestion des utilisateurs</h1>
      
      {error && <div className="text-red-500">{error}</div>}
      
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nom</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.name || '-'}</td>
                  <td>
                    {user.isBanned ? 'Banni' : user.isActive ? 'Actif' : 'Inactif'}
                  </td>
                  <td>
                    <button onClick={() => handleDelete(user.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {pagination && (
            <div>
              Page {pagination.page} sur {pagination.totalPages}
              <button onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}>Suivant</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

### 6. useMigration

```tsx
import { useMigration } from '@/hooks'

function MigrationPage() {
  const { migrating, error, results, migrate, collectLocalStorageData } = useMigration()

  const handleMigrate = async () => {
    // Afficher un aperçu des données
    const data = collectLocalStorageData()
    console.log('Données à migrer:', {
      users: data.users.length,
      watchlist: data.watchlist.length,
      watchHistory: data.watchHistory.length,
      favorites: data.favorites.length,
      ratings: data.ratings.length,
    })

    // Confirmer
    if (confirm('Voulez-vous migrer ces données vers PostgreSQL ?')) {
      await migrate()
    }
  }

  return (
    <div>
      <h1>Migration des données</h1>
      
      <button
        onClick={handleMigrate}
        disabled={migrating}
        className="bg-blue-500 text-white px-6 py-3 rounded"
      >
        {migrating ? 'Migration en cours...' : 'Migrer les données'}
      </button>

      {error && (
        <div className="text-red-500 mt-4">
          Erreur: {error}
        </div>
      )}

      {results && (
        <div className="mt-4">
          <h2>Résultats de la migration</h2>
          <ul>
            <li>Utilisateurs: {results.users.migrated} migrés, {results.users.skipped} ignorés, {results.users.errors} erreurs</li>
            <li>Watchlist: {results.watchlist.migrated} migrés, {results.watchlist.errors} erreurs</li>
            <li>Historique: {results.watchHistory.migrated} migrés, {results.watchHistory.errors} erreurs</li>
            <li>Favoris: {results.favorites.migrated} migrés, {results.favorites.errors} erreurs</li>
            <li>Notes: {results.ratings.migrated} migrés, {results.ratings.errors} erreurs</li>
          </ul>
        </div>
      )}
    </div>
  )
}
```

---

## 🔄 Combinaison de Hooks

### Exemple : Composant de contenu avec toutes les fonctionnalités

```tsx
import { useWatchlist, useFavorites, useWatchHistory } from '@/hooks'
import { useAuth } from '@/lib/auth-context'

function ContentCard({ content }) {
  const { user } = useAuth()
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist(user?.id)
  const { toggleFavorite, isFavorite } = useFavorites(user?.id)
  const { saveProgress, getProgress } = useWatchHistory(user?.id)

  const progress = getProgress(content.id)
  const progressPercent = progress && content.duration
    ? (progress.progress / content.duration) * 100
    : 0

  return (
    <div className="relative">
      <img src={content.poster} alt={content.title} />
      
      {/* Barre de progression */}
      {progressPercent > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div
            className="h-full bg-red-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={() => toggleFavorite(content.id, content.type)}
          className={isFavorite(content.id, content.type) ? 'text-red-500' : 'text-white'}
        >
          ❤️
        </button>
        <button
          onClick={() => {
            if (isInWatchlist(content.id, content.type)) {
              removeFromWatchlist(content.id, content.type)
            } else {
              addToWatchlist(content.id, content.type)
            }
          }}
          className={isInWatchlist(content.id, content.type) ? 'text-blue-500' : 'text-white'}
        >
          ➕
        </button>
      </div>
    </div>
  )
}
```

---

## ⚡ Optimisations

### Cache et Optimistic Updates

Tous les hooks utilisent des **optimistic updates** pour une meilleure UX :

```tsx
// L'élément est ajouté immédiatement à la liste locale
// La requête API se fait en arrière-plan
await addToWatchlist(contentId, contentType)
// ✅ L'UI est mise à jour instantanément
```

### Gestion d'Erreurs

Tous les hooks gèrent les erreurs automatiquement :

```tsx
const { error, addToWatchlist } = useWatchlist(userId)

// Afficher l'erreur si présente
{error && (
  <div className="text-red-500">
    {error}
  </div>
)}
```

### Rechargement Automatique

Les hooks rechargent automatiquement les données au montage :

```tsx
// Pas besoin d'appeler manuellement fetchUsers()
// Les données sont chargées automatiquement
const { users, loading } = useUsers()
```

---

## 📊 Avantages

- ✅ **Type-safe** : TypeScript complet
- ✅ **Optimistic updates** : UI réactive
- ✅ **Gestion d'erreurs** : Automatique
- ✅ **CSRF protection** : Intégrée
- ✅ **Rate limiting** : Géré par l'API
- ✅ **Réutilisable** : Facile à utiliser dans n'importe quel composant

---

*Guide créé le 22 Novembre 2025*

