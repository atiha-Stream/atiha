# 🚀 Guide Rapide : Mise en Place Architecture Anonyme

## 📋 Prérequis

1. **Domaines achetés** avec protection WHOIS activée
2. **2 VPS** (1 Frontend, 1 Backend) avec IPs différentes
3. **Nginx** installé sur les VPS
4. **Certificats SSL** (Let's Encrypt recommandé)

---

## ⚡ Démarrage Rapide

### 1. Générer la Configuration

```powershell
.\scripts\setup-architecture-anonyme.ps1 -Mode generate-config `
    -Domain1 "atiha-redir-1.com" `
    -Domain2 "atiha-redir-2.com" `
    -FrontendIP "98.96.218.35" `
    -BackendIP "107.151.135.63"
```

### 2. Générer les Configurations DNS

```powershell
.\scripts\setup-architecture-anonyme.ps1 -Mode setup-dns `
    -Domain1 "atiha-redir-1.com" `
    -Domain2 "atiha-redir-2.com" `
    -FrontendIP "98.96.218.35" `
    -BackendIP "107.151.135.63"
```

Copier les enregistrements DNS dans votre panneau de contrôle DNS.

### 3. Générer les Configurations Nginx

```powershell
.\scripts\setup-architecture-anonyme.ps1 -Mode setup-nginx `
    -Domain1 "atiha-redir-1.com" `
    -Domain2 "atiha-redir-2.com" `
    -FrontendIP "98.96.218.35" `
    -BackendIP "107.151.135.63"
```

Copier les fichiers générés sur vos serveurs :
- `config/nginx-frontend.conf` → VPS Frontend
- `config/nginx-backend.conf` → VPS Backend

### 4. Vérifier la Configuration

```powershell
# Vérifier DNS
.\scripts\setup-architecture-anonyme.ps1 -Mode check-dns -Domain1 "atiha-redir-1.com"

# Vérifier WHOIS
.\scripts\setup-architecture-anonyme.ps1 -Mode check-whois -Domain1 "atiha-redir-1.com"

# Tester connectivité
.\scripts\setup-architecture-anonyme.ps1 -Mode test-connectivity -Domain1 "atiha-redir-1.com" -FrontendIP "98.96.218.35"
```

---

## 📁 Fichiers Générés

Après exécution, vous aurez :

```
config/
├── architecture.json      # Configuration principale
├── sdk_config.json        # Config pour l'application mobile/web
├── dns-config.txt         # Enregistrements DNS à copier
├── nginx-frontend.conf    # Config Nginx pour serveur frontend
└── nginx-backend.conf     # Config Nginx pour serveur backend
```

---

## 🔧 Déploiement sur Serveurs

### Sur le VPS Frontend

```bash
# 1. Copier la config
sudo cp nginx-frontend.conf /etc/nginx/sites-available/atiha-frontend

# 2. Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/atiha-frontend /etc/nginx/sites-enabled/

# 3. Générer le certificat SSL
sudo certbot --nginx -d atiha-redir-1.com -d www.atiha-redir-1.com

# 4. Tester la config
sudo nginx -t

# 5. Redémarrer Nginx
sudo systemctl restart nginx
```

### Sur le VPS Backend

```bash
# 1. Copier la config
sudo cp nginx-backend.conf /etc/nginx/sites-available/atiha-backend

# 2. Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/atiha-backend /etc/nginx/sites-enabled/

# 3. Générer le certificat SSL
sudo certbot --nginx -d api-gateway.atiha-redir-1.com -d api-gateway.atiha-redir-2.com

# 4. Configurer le firewall
sudo ufw allow from 98.96.218.35 to any port 443
sudo ufw deny 443

# 5. Tester et redémarrer
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📱 Intégration dans l'Application

Le fichier `config/sdk_config.json` est généré automatiquement. Utilisez-le dans votre application :

```javascript
// JavaScript/TypeScript
const config = require('./config/sdk_config.json');
const apiHost = config.host_list[0]; // Premier host
const cdnUrl = config.cdn_url;
```

```kotlin
// Android/Kotlin
val config = loadConfigFromAssets("sdk_config.json")
val apiHost = config.host_list.random() // Load balancing
```

---

## ✅ Checklist de Déploiement

- [ ] Domaines achetés avec protection WHOIS
- [ ] Configuration DNS appliquée
- [ ] VPS Frontend configuré avec Nginx
- [ ] VPS Backend configuré avec Nginx
- [ ] Certificats SSL générés (Let's Encrypt)
- [ ] Firewall configuré (autoriser uniquement IPs frontend)
- [ ] Logs désactivés
- [ ] Configuration testée (check-dns, test-connectivity)
- [ ] Application mobile/web configurée avec sdk_config.json
- [ ] Monitoring discret activé

---

## 🔍 Vérification Finale

```powershell
# Vérifier que tout fonctionne
.\scripts\setup-architecture-anonyme.ps1 -Mode check-dns -Domain1 "atiha-redir-1.com"
.\scripts\setup-architecture-anonyme.ps1 -Mode check-dns -Domain1 "atiha-redir-2.com"

# Tester l'API
curl https://api-gateway.atiha-redir-1.com/api/health
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `GUIDE_ARCHITECTURE_ANONYME_ATIHA.md` - Guide complet détaillé

