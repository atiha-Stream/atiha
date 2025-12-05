# Atiha - Documentation Complète

## 🎬 Vue d'ensemble

Atiha est une application de streaming de films moderne, inspirée de Netflix, développée avec React et Node.js. Elle offre une expérience utilisateur fluide pour découvrir, regarder et gérer des films et séries.

## 🚀 Fonctionnalités

### ✅ Fonctionnalités Implémentées

- **Interface utilisateur moderne** avec design responsive
- **Système d'authentification** sécurisé avec JWT
- **Gestion des films** avec recherche et filtres avancés
- **Lecture de vidéos** en streaming
- **Gestion des favoris** et liste de lecture
- **Historique de visionnage** avec progression
- **Recommandations personnalisées**
- **Interface d'administration** pour la gestion des contenus
- **API RESTful** complète
- **Base de données MongoDB** avec index optimisés
- **Déploiement Docker** prêt pour la production

### 🔄 Fonctionnalités en Développement

- **Système de commentaires** et avis
- **Profils multiples** par utilisateur
- **Téléchargement hors ligne**
- **Synchronisation multi-appareils**
- **Notifications push**
- **Intégration avec les réseaux sociaux**

## 🛠️ Architecture Technique

### Backend (Node.js + Express)

```
server/
├── models/           # Modèles MongoDB (User, Movie)
├── routes/           # Routes API (auth, movies, users)
├── middleware/       # Middleware (auth, error handling)
├── scripts/          # Scripts utilitaires (seed data)
└── index.js          # Point d'entrée du serveur
```

### Frontend (React + TypeScript)

```
client/
├── src/
│   ├── components/   # Composants réutilisables
│   ├── pages/        # Pages de l'application
│   ├── services/     # Services API
│   ├── store/        # Gestion d'état (Zustand)
│   └── styles/       # Styles CSS/Tailwind
└── public/           # Fichiers statiques
```

### Base de Données (MongoDB)

- **Collection Users** : Gestion des utilisateurs et préférences
- **Collection Movies** : Catalogue de films avec métadonnées
- **Index optimisés** pour les performances de recherche

## 📦 Installation et Configuration

### Prérequis

- Node.js 18+ 
- MongoDB 7.0+
- npm ou yarn
- Docker (optionnel)

### Installation Rapide

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd atiha
   ```

2. **Installation automatique (Windows)**
   ```bash
   start-dev.bat
   ```

3. **Installation automatique (Linux/Mac)**
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

### Installation Manuelle

1. **Installer les dépendances**
   ```bash
   npm run install-all
   ```

2. **Configurer l'environnement**
   ```bash
   cp env.example .env
   # Éditer .env avec vos configurations
   ```

3. **Initialiser la base de données**
   ```bash
   cd server
   node scripts/seedData.js
   cd ..
   ```

4. **Démarrer les services**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm start
   ```

## 🐳 Déploiement avec Docker

### Déploiement Simple

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Services Docker

- **MongoDB** : Base de données sur le port 27017
- **Backend** : API sur le port 5000
- **Frontend** : Interface sur le port 3000
- **Nginx** : Reverse proxy sur le port 80

## 🔧 Configuration

### Variables d'Environnement

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/atiha
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_IMAGE_BASE_URL=http://localhost:5000
REACT_APP_VIDEO_BASE_URL=http://localhost:5000
```

## 📚 API Documentation

### Authentification

#### POST /api/auth/register
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```

#### POST /api/auth/login
```json
{
  "email": "string",
  "password": "string"
}
```

### Films

#### GET /api/movies
Paramètres de requête :
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 20)
- `search` : Terme de recherche
- `genres` : Genres séparés par des virgules
- `year` : Année de sortie
- `rating` : Note minimum
- `sortBy` : Champ de tri
- `sortOrder` : Ordre (asc/desc)

#### GET /api/movies/:id
Récupère les détails d'un film

#### GET /api/movies/:id/watch
Récupère l'URL de streaming (authentification requise)

### Utilisateurs

#### GET /api/users/profile
Récupère le profil utilisateur

#### PUT /api/users/profile
Met à jour le profil utilisateur

#### POST /api/users/favorites/:movieId
Ajoute un film aux favoris

#### DELETE /api/users/favorites/:movieId
Retire un film des favoris

## 🎨 Interface Utilisateur

### Pages Principales

- **Accueil** (`/`) : Films en vedette et recommandations
- **Parcourir** (`/browse`) : Catalogue avec filtres
- **Détail Film** (`/movie/:id`) : Informations détaillées
- **Lecture** (`/watch/:id`) : Lecteur vidéo
- **Profil** (`/profile`) : Gestion du compte
- **Favoris** (`/favorites`) : Films favoris
- **Ma Liste** (`/watchlist`) : Liste de lecture
- **Historique** (`/history`) : Historique de visionnage

### Composants Clés

- **HeroSection** : Bannière principale avec films en vedette
- **MovieCarousel** : Carrousel de films avec navigation
- **MovieCard** : Carte de film avec actions rapides
- **Navbar** : Navigation principale responsive
- **VideoPlayer** : Lecteur vidéo intégré

## 🔐 Sécurité

### Authentification
- JWT tokens avec expiration
- Refresh tokens automatiques
- Protection des routes sensibles
- Validation des données d'entrée

### Sécurité API
- Rate limiting
- CORS configuré
- Helmet pour les headers de sécurité
- Validation avec Joi
- Sanitisation des données

### Base de Données
- Chiffrement des mots de passe (bcrypt)
- Index optimisés
- Validation des schémas
- Protection contre l'injection

## 📊 Performance

### Optimisations Frontend
- Lazy loading des composants
- Mise en cache avec React Query
- Images optimisées
- Code splitting
- Service Worker (PWA)

### Optimisations Backend
- Index MongoDB optimisés
- Pagination des résultats
- Compression gzip
- Mise en cache des requêtes
- Pool de connexions

### Optimisations Base de Données
- Index sur les champs de recherche
- Index composés pour les requêtes complexes
- Agrégation MongoDB pour les statistiques
- Réplication pour la haute disponibilité

## 🧪 Tests

### Tests Backend
```bash
cd server
npm test
```

### Tests Frontend
```bash
cd client
npm test
```

### Tests d'Intégration
```bash
npm run test:integration
```

## 📈 Monitoring et Logs

### Logs
- Logs structurés avec Winston
- Rotation automatique des logs
- Niveaux de log configurables

### Monitoring
- Health checks API
- Métriques de performance
- Alertes automatiques
- Dashboard de monitoring

## 🚀 Déploiement en Production

### Checklist Pré-Déploiement
- [ ] Variables d'environnement configurées
- [ ] Base de données sécurisée
- [ ] SSL/TLS configuré
- [ ] CDN configuré pour les assets
- [ ] Monitoring en place
- [ ] Sauvegardes automatiques
- [ ] Tests de charge effectués

### Déploiement
```bash
# Build des images Docker
docker-compose -f docker-compose.prod.yml build

# Déploiement
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contribution

### Guidelines
1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

### Standards de Code
- ESLint pour le JavaScript
- Prettier pour le formatage
- Tests unitaires requis
- Documentation des nouvelles fonctionnalités

## 📞 Support

### Comptes de Test
- **Demo User** : demo@atiha.com / demo123
- **Admin User** : admin@user.com / admin@user@2025

### Ressources
- Documentation API : `/api/docs`
- Status : `/api/health`
- Logs : `docker-compose logs`

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements

- Netflix pour l'inspiration
- La communauté open source
- Tous les contributeurs

---

**Atiha** - Votre plateforme de streaming préférée 🎬

