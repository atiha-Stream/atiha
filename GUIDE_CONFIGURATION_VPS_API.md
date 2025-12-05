# 🚀 Guide : Configuration VPS + API pour Atiha

## 📋 Ordre des Étapes

```
1. ✅ Acheter le VPS Backend (Offshore)
2. ✅ Configurer le VPS (OS, sécurité)
3. 🔴 Configurer l'API Backend
4. 🔴 Configurer PostgreSQL
5. 🔴 Déployer l'application
6. 🔴 Connecter Cloudflare → VPS
```

---

## 🎯 Étape 1 : Acheter le VPS

### Fournisseurs Recommandés

**VPS Offshore** :
- **1984 Hosting** (Islande) - ~$15/mois
- **OrangeWebsite** (Islande) - ~$20/mois
- **FlokiNET** (Islande) - ~$18/mois
- **Njalla** (Panama) - ~$20/mois

**Spécifications Minimales** :
- CPU : 2 vCPU
- RAM : 4 GB
- Stockage : 50 GB SSD
- OS : Ubuntu Server 22.04 LTS (recommandé)

---

## 🔴 Étape 2 : Configuration Initiale du VPS

### 2.1 Installation du Système d'Exploitation

Lors de l'achat du VPS, choisir :
- **Ubuntu Server 22.04 LTS** (recommandé)
- Ou **Debian 11**

### 2.2 Connexion SSH

```bash
ssh root@VOTRE_IP_VPS
# Ou
ssh utilisateur@VOTRE_IP_VPS
```

### 2.3 Mise à Jour du Système

```bash
sudo apt update
sudo apt upgrade -y
```

### 2.4 Configuration de Base

```bash
# Créer un utilisateur non-root
sudo adduser atiha
sudo usermod -aG sudo atiha

# Configuration firewall (UFW)
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔴 Étape 3 : Installation des Prérequis

### 3.1 Node.js

```bash
# Installer Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier
node --version  # Doit afficher v20.x.x
npm --version
```

### 3.2 PostgreSQL

```bash
# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Démarrer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer un utilisateur et une base de données
sudo -u postgres psql
```

Dans PostgreSQL :
```sql
CREATE USER atiha_user WITH PASSWORD 'votre_mot_de_passe_securise';
CREATE DATABASE atiha_db OWNER atiha_user;
GRANT ALL PRIVILEGES ON DATABASE atiha_db TO atiha_user;
\q
```

### 3.3 Nginx

```bash
# Installer Nginx
sudo apt install -y nginx

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.4 PM2 (Gestion des Processus Node.js)

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Démarrer PM2 au boot
pm2 startup
```

---

## 🔴 Étape 4 : Configuration de l'API Backend

### 4.1 Créer la Structure du Projet

```bash
# Créer le dossier
sudo mkdir -p /var/www/atiha
sudo chown -R atiha:atiha /var/www/atiha

# Aller dans le dossier
cd /var/www/atiha
```

### 4.2 Initialiser le Projet Node.js

```bash
# Initialiser npm
npm init -y

# Installer les dépendances
npm install express cors dotenv
npm install pg                    # Pour PostgreSQL
npm install multer                # Pour upload de fichiers
npm install socket.io             # Pour WebSocket (optionnel)

# Dépendances de développement
npm install --save-dev nodemon
```

### 4.3 Structure des Fichiers

```bash
/var/www/atiha/
├── server.js              # Point d'entrée
├── package.json
├── .env                   # Variables d'environnement
├── config/
│   └── database.js        # Configuration PostgreSQL
├── routes/
│   ├── movies.js          # Routes films
│   ├── users.js           # Routes utilisateurs
│   └── files.js           # Routes fichiers
├── controllers/
│   └── movieController.js
├── models/
│   └── Movie.js
└── public/
    └── files/             # Fichiers uploadés
        ├── posters/
        ├── avatars/
        └── videos/
```

---

## 🔴 Étape 5 : Créer l'API REST

### 5.1 Fichier `server.js`

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const moviesRoutes = require('./routes/movies');
const usersRoutes = require('./routes/users');
const filesRoutes = require('./routes/files');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['https://atiha-redir-1.com', 'https://atiha-redir-2.com'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/files', express.static('public/files'));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/movies', moviesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/files', filesRoutes);

// Démarrer le serveur
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
```

### 5.2 Fichier `.env`

```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=atiha_db
DB_USER=atiha_user
DB_PASSWORD=votre_mot_de_passe_securise

PORT=3000
NODE_ENV=production
```

### 5.3 Configuration Base de Données `config/database.js`

```javascript
// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
```

### 5.4 Routes Films `routes/movies.js`

```javascript
// routes/movies.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/movies - Récupérer tous les films
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/movies - Ajouter un film
router.post('/', async (req, res) => {
  try {
    const { title, year, rating, description, poster_url } = req.body;
    const result = await pool.query(
      'INSERT INTO movies (title, year, rating, description, poster_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, year, rating, description, poster_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/movies/:id - Récupérer un film
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
```

### 5.5 Créer les Tables PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql -d atiha_db
```

```sql
-- Table films
CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  rating DECIMAL(3,1),
  description TEXT,
  poster_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table utilisateurs
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table playlists (relations utilisateurs ↔ films)
CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, movie_id)
);

\q
```

---

## 🔴 Étape 6 : Configuration Nginx

### 6.1 Fichier de Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/atiha-backend
```

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    
    server_name api-gateway.atiha-redir-1.com api-gateway.atiha-redir-2.com;
    
    # SSL (à générer avec Certbot)
    # ssl_certificate /etc/letsencrypt/live/api-gateway.atiha-redir-1.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api-gateway.atiha-redir-1.com/privkey.pem;
    
    # Désactiver les logs
    access_log off;
    error_log /dev/null crit;
    
    # Firewall : Autoriser uniquement Cloudflare IPs (optionnel)
    # allow IP_CLOUDFLARE_1;
    # deny all;
    
    # Proxy vers application Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Servir les fichiers statiques directement
    location /files/ {
        alias /var/www/atiha/public/files/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Activer le Site

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/atiha-backend /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 🔴 Étape 7 : Générer le Certificat SSL

### 7.1 Installer Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Générer le Certificat

```bash
sudo certbot --nginx -d api-gateway.atiha-redir-1.com -d api-gateway.atiha-redir-2.com
```

Certbot configure automatiquement SSL dans Nginx.

---

## 🔴 Étape 8 : Démarrer l'Application

### 8.1 Démarrer avec PM2

```bash
cd /var/www/atiha
pm2 start server.js --name atiha-api
pm2 save
pm2 startup
```

### 8.2 Vérifier le Statut

```bash
pm2 status
pm2 logs atiha-api
```

---

## 🔴 Étape 9 : Connecter Cloudflare au VPS

### 9.1 Configurer les DNS dans Cloudflare

Dans le dashboard Cloudflare :

```
Type    Nom           Contenu              Proxy
A       @             IP_VPS_BACKEND       🟠 ON
CNAME   api-gateway   IP_VPS_BACKEND       ⚪ OFF (DNS Only)
```

### 9.2 Tester

```bash
# Depuis votre machine
curl https://api-gateway.atiha-redir-1.com/api/health
```

Devrait retourner :
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

---

## ✅ Checklist Complète

### VPS Initial
- [ ] VPS acheté (Ubuntu 22.04)
- [ ] Accès SSH configuré
- [ ] Système mis à jour
- [ ] Firewall configuré (UFW)

### Installation
- [ ] Node.js installé (v20.x)
- [ ] PostgreSQL installé et configuré
- [ ] Nginx installé
- [ ] PM2 installé

### Base de Données
- [ ] Base de données `atiha_db` créée
- [ ] Utilisateur `atiha_user` créé
- [ ] Tables créées (movies, users, playlists)

### API Backend
- [ ] Projet Node.js initialisé
- [ ] Dépendances installées
- [ ] `server.js` créé
- [ ] Routes configurées
- [ ] `.env` configuré

### Configuration Serveur
- [ ] Nginx configuré
- [ ] SSL généré (Certbot)
- [ ] Application démarrée avec PM2

### Cloudflare
- [ ] DNS configuré dans Cloudflare
- [ ] Test de connectivité réussi

---

## 🎯 Prochaines Étapes

Une fois l'API configurée :

1. **Créer plus de routes** (utilisateurs, authentification)
2. **Upload de fichiers** (images, vidéos)
3. **WebSockets** (synchronisation temps réel)
4. **Authentification** (JWT, sessions)
5. **Tests** (Postman, tests automatisés)

---

**Date de création** : $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Version** : 1.0

