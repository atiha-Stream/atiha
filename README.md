# Atiha - Application de Streaming de Films

Atiha est une application de streaming de films moderne, inspirée de Netflix, développée avec React et Node.js.

## 🎬 Fonctionnalités

- **Interface utilisateur moderne** avec design responsive
- **Système d'authentification** sécurisé
- **Lecture de vidéos** en streaming avec support HLS et Webtor
- **Transcodage HLS en temps réel** pour un streaming optimisé
- **Streaming torrent P2P** avec Webtor.io SDK
- **Gestion des favoris** et historique
- **Recherche avancée** de films
- **Catégorisation** par genres
- **Recommandations personnalisées**
- **Panel d'administration** complet
- **Application Progressive Web App (PWA)**

## 🚀 Installation

1. Cloner le projet
2. Installer les dépendances :
   ```bash
   npm run install-all
   ```

3. Démarrer l'application :
   ```bash
   npm run dev
   ```

## 🎥 Streaming HLS

Atiha inclut un système de transcodage HLS en temps réel pour un streaming optimisé :

### Démarrage rapide du serveur HLS

**Windows:**
```bash
# Script automatique
scripts\start-hls-transcoder.bat

# Ou PowerShell
scripts\start-hls-transcoder.ps1
```

**Linux/macOS:**
```bash
# Configuration automatique
./scripts/setup-hls-transcoder.sh

# Démarrage
./start-hls-transcoder.sh
```

**Docker:**
```bash
docker-compose -f docker-compose.hls.yml up -d
```

### Test du système HLS

1. Accédez à `/test-hls` pour tester le lecteur HLS
2. Configurez l'URL du serveur HLS
3. Testez avec des URLs de vidéos compatibles

### Configuration

Copiez `env.hls.example` vers `.env.local` et configurez :
```env
HLS_TRANSCODER_URL=http://localhost:8080
HLS_TRANSCODER_ENABLED=true
HLS_DEFAULT_QUALITY=auto
HLS_DEFAULT_PRESET=fast
```

📖 **Documentation complète** : 
- [HLS_INTEGRATION_GUIDE.md](./HLS_INTEGRATION_GUIDE.md) - Transcodage HLS
- [WEBTOR_INTEGRATION_GUIDE.md](./WEBTOR_INTEGRATION_GUIDE.md) - Streaming Torrent P2P

## 🌊 Streaming Torrent P2P

Atiha inclut un système de streaming torrent P2P avec Webtor.io SDK :

### Utilisation rapide

1. **Ajoutez un contenu** avec une URL magnet ou torrent
2. **Sélectionnez le type** `webtor` dans l'admin
3. **Le lecteur** se charge automatiquement avec le streaming P2P

### Test du système Webtor

1. Accédez à `/test-webtor` pour tester le lecteur torrent
2. Utilisez des URLs magnet d'exemple
3. Configurez les fonctionnalités Webtor

### Configuration

Copiez `env.hls.example` vers `.env.local` et ajoutez :
```env
NEXT_PUBLIC_WEBTOR_BASE_URL=https://webtor.io
NEXT_PUBLIC_WEBTOR_LANG=fr
NEXT_PUBLIC_WEBTOR_ENABLED=true
```

### Avantages du streaming torrent

- **P2P** : Partage de bande passante entre utilisateurs
- **Pas de serveur** : Pas besoin d'héberger les fichiers
- **Démarrage rapide** : Lecture sans téléchargement complet
- **Sous-titres automatiques** : Recherche OpenSubtitles
- **Multi-format** : Support MP4, MKV, AVI, MOV, WebM

## 🛠️ Technologies

- **Frontend** : Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express, MongoDB
- **Authentification** : JWT, Context API
- **Streaming** : Video.js, HLS.js, FFmpeg, Webtor.io SDK
- **Transcodage HLS** : Go, FFmpeg
- **Streaming Torrent** : Webtor.io, WebTorrent
- **PWA** : next-pwa, Service Workers
- **UI/UX** : Heroicons, React Hot Toast

## 📁 Structure du Projet

```
atiha/
├── src/                    # Code source Next.js
│   ├── app/               # Pages et layouts
│   ├── components/        # Composants React
│   ├── lib/              # Services et utilitaires
│   └── types/            # Types TypeScript
├── torrentPlayer/         # Serveur de transcodage HLS
│   └── content-transcoder-master/
├── scripts/              # Scripts de déploiement
├── public/               # Assets statiques
└── docs/                 # Documentation
```

## 🎯 Roadmap

- [x] Structure de base
- [ ] Interface utilisateur
- [ ] Système d'authentification
- [ ] Gestion des films
- [ ] Streaming vidéo
- [ ] Recommandations
- [ ] Tests et déploiement

