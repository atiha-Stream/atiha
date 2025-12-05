# 📚 Guide d'Utilisation des Routes API

**Date:** 2025-11-22  
**Statut:** ✅ Routes API complètes

---

## 🚀 Démarrage Rapide

### 1. Configuration

Assurez-vous que les services sont démarrés :

```bash
# Démarrer PostgreSQL et Redis
docker-compose up -d

# Initialiser la base de données
npm run db:generate
npm run db:migrate
```

### 2. Variables d'environnement

```env
DATABASE_URL="postgresql://atiha:password@localhost:5432/atiha_db"
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your_redis_password"
```

---

## 📋 Routes Disponibles

### Utilisateurs

#### `GET /api/users`
Liste paginée des utilisateurs (admin uniquement)

```typescript
const response = await fetch('/api/users?page=1&limit=20', {
  credentials: 'include',
})
const { users, pagination } = await response.json()
```

#### `POST /api/users`
Créer un nouvel utilisateur

```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123!',
    name: 'John Doe',
  }),
})
const { user } = await response.json()
```

#### `GET /api/users/[id]`
Récupérer un utilisateur

```typescript
const response = await fetch(`/api/users/${userId}`, {
  credentials: 'include',
})
const { user } = await response.json()
```

#### `PUT /api/users/[id]`
Mettre à jour un utilisateur

```typescript
const response = await fetch(`/api/users/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Jane Doe',
    phone: '+1234567890',
  }),
})
```

#### `DELETE /api/users/[id]`
Supprimer un utilisateur (admin uniquement)

```typescript
const response = await fetch(`/api/users/${userId}`, {
  method: 'DELETE',
  credentials: 'include',
})
```

---

### Watchlist

#### `GET /api/users/[id]/watchlist`
Récupérer la watchlist

```typescript
const response = await fetch(`/api/users/${userId}/watchlist`, {
  credentials: 'include',
})
const { watchlist } = await response.json()
```

#### `POST /api/users/[id]/watchlist`
Ajouter à la watchlist

```typescript
const response = await fetch(`/api/users/${userId}/watchlist`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    contentId: 'movie-123',
    contentType: 'movie',
  }),
})
```

#### `DELETE /api/users/[id]/watchlist`
Retirer de la watchlist

```typescript
const response = await fetch(
  `/api/users/${userId}/watchlist?contentId=movie-123&contentType=movie`,
  {
    method: 'DELETE',
    credentials: 'include',
  }
)
```

---

### Historique de Visionnage

#### `GET /api/users/[id]/watch-history`
Récupérer l'historique

```typescript
const response = await fetch(
  `/api/users/${userId}/watch-history?contentType=movie&limit=50`,
  {
    credentials: 'include',
  }
)
const { history } = await response.json()
```

#### `POST /api/users/[id]/watch-history`
Sauvegarder la progression

```typescript
const response = await fetch(`/api/users/${userId}/watch-history`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    contentId: 'movie-123',
    contentType: 'movie',
    progress: 3600, // secondes
    duration: 7200,
    completed: false,
  }),
})
```

---

### Favoris

#### `GET /api/users/[id]/favorites`
Récupérer les favoris

```typescript
const response = await fetch(`/api/users/${userId}/favorites`, {
  credentials: 'include',
})
const { favorites } = await response.json()
```

#### `POST /api/users/[id]/favorites`
Ajouter un favori

```typescript
const response = await fetch(`/api/users/${userId}/favorites`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    contentId: 'movie-123',
    contentType: 'movie',
  }),
})
```

#### `DELETE /api/users/[id]/favorites`
Retirer un favori

```typescript
const response = await fetch(
  `/api/users/${userId}/favorites?contentId=movie-123&contentType=movie`,
  {
    method: 'DELETE',
    credentials: 'include',
  }
)
```

---

### Sessions

#### `GET /api/sessions`
Récupérer les sessions actives

```typescript
const response = await fetch('/api/sessions', {
  credentials: 'include',
})
const { sessions } = await response.json()
```

#### `DELETE /api/sessions`
Supprimer une session

```typescript
const response = await fetch('/api/sessions?id=session-id', {
  method: 'DELETE',
  credentials: 'include',
})
```

---

### Administrateurs

#### `GET /api/admins`
Liste des admins (super admin uniquement)

```typescript
const response = await fetch('/api/admins', {
  credentials: 'include',
})
const { admins } = await response.json()
```

#### `POST /api/admins`
Créer un admin (super admin uniquement)

```typescript
const response = await fetch('/api/admins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    username: 'newadmin',
    password: 'securePassword123!',
    email: 'admin@example.com',
    role: 'admin',
    permissions: [],
  }),
})
```

---

### Migration

#### `POST /api/migration/localStorage`
Migrer les données depuis localStorage

```typescript
// Récupérer les données depuis localStorage
const users = JSON.parse(localStorage.getItem('atiha_users_database') || '[]')
const watchlist = JSON.parse(localStorage.getItem('atiha_watchlist') || '[]')
// ... autres données

// Migrer
const response = await fetch('/api/migration/localStorage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    users,
    watchlist,
    watchHistory,
    favorites,
    ratings,
  }),
})

const { success, results } = await response.json()
console.log('Migration terminée:', results)
```

---

## 🔒 Authentification

Toutes les routes nécessitent l'authentification via cookies httpOnly :

```typescript
// Les cookies sont automatiquement inclus avec credentials: 'include'
const response = await fetch('/api/users', {
  credentials: 'include', // Important !
})
```

---

## ⚡ Rate Limiting

Les routes sont protégées par rate limiting :

- **API générales** : 60 requêtes / minute
- **Routes admin** : 30 requêtes / minute
- **Login** : 5 tentatives / 15 minutes

Les headers de réponse incluent :
- `X-RateLimit-Limit` : Limite maximale
- `X-RateLimit-Remaining` : Requêtes restantes
- `X-RateLimit-Reset` : Date de réinitialisation

---

## 🛠️ Hooks React Recommandés

Créer des hooks personnalisés pour faciliter l'utilisation :

```typescript
// hooks/useWatchlist.ts
export function useWatchlist(userId: string) {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/users/${userId}/watchlist`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setWatchlist(data.watchlist)
        setLoading(false)
      })
  }, [userId])

  const addToWatchlist = async (contentId: string, contentType: string) => {
    const response = await fetch(`/api/users/${userId}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ contentId, contentType }),
    })
    const { item } = await response.json()
    setWatchlist([...watchlist, item])
  }

  return { watchlist, loading, addToWatchlist }
}
```

---

## 📊 Gestion d'Erreurs

Toutes les routes retournent un format standardisé :

```typescript
// Succès
{
  success: true,
  data: { ... }
}

// Erreur
{
  success: false,
  error: "Message d'erreur"
}
```

Exemple de gestion :

```typescript
try {
  const response = await fetch('/api/users/123', {
    credentials: 'include',
  })
  
  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error)
  }
  
  const { user } = await response.json()
  return user
} catch (error) {
  console.error('Erreur:', error)
  // Gérer l'erreur
}
```

---

## ✅ Checklist de Test

- [ ] Tester la création d'utilisateur
- [ ] Tester la récupération d'utilisateur
- [ ] Tester l'ajout à la watchlist
- [ ] Tester la sauvegarde de l'historique
- [ ] Tester les favoris
- [ ] Tester la gestion des sessions
- [ ] Tester la migration depuis localStorage
- [ ] Vérifier le rate limiting
- [ ] Vérifier les permissions (utilisateur/admin)

---

*Guide créé le 22 Novembre 2025*

