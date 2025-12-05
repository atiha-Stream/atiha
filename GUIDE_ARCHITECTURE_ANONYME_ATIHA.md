# 🏗️ Guide : Mise en Place d'Architecture Anonyme pour Atiha

## 📋 Vue d'Ensemble

Ce guide décrit comment mettre en place une architecture multi-couches avec masquage d'infrastructure, similaire à celle utilisée par FreeCine.

## 🎯 Architecture Cible

```
┌─────────────────────────────────────────────────────────┐
│  Application Mobile/Web Atiha                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ [Requête initiale]
┌─────────────────────────────────────────────────────────┐
│  COUCHE 1: Domaines de Redirection (Frontend)          │
│  • domaine-redir-1.com (IP: X.X.X.X)                   │
│  • domaine-redir-2.com (IP: X.X.X.X) - Miroir          │
│  [Rôle: Redirection + Masquage]                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ [Redirection vers sous-domaine]
┌─────────────────────────────────────────────────────────┐
│  COUCHE 2: API Gateway (Backend API)                   │
│  • api-gateway.domaine-redir-1.com (IP: Y.Y.Y.Y)       │
│  • api-gateway.domaine-redir-2.com (IP: Y.Y.Y.Y)       │
│  [Rôle: Backend API réel]                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ [Tunnel/Proxy]
┌─────────────────────────────────────────────────────────┐
│  COUCHE 3: CDN Anonyme                                 │
│  • cdn-anonyme.tld-suspect.site                        │
│  [Rôle: Distribution + Masquage supplémentaire]         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ [Relais]
┌─────────────────────────────────────────────────────────┐
│  COUCHE 4: VPS Offshore / Infrastructure Réelle        │
│  • VPS anonyme (IP masquée)                            │
│  • Contenu réel (vidéos, API, base de données)         │
│  [Rôle: Serveur réel - Totalement masqué]              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Étape par Étape

### ÉTAPE 1 : Choix et Achat des Domaines 🔴

#### Domaines Principaux (Frontend)

**Critères** :
- ✅ Noms génériques/non descriptifs
- ✅ TLD standard (.com, .net) mais possiblement .site pour CDN
- ✅ Enregistrement anonyme activé

**Recommandations** :
```
atiha-redir-1.com
atiha-redir-2.com
atiha-gateway-1.com
atiha-gateway-2.com
```

**Services d'enregistrement anonymes** :
- Namecheap (WhoisGuard)
- GoDaddy (Domains By Proxy)
- NameSilo (Privacy Protection)
- Cloudflare (Proxy anonyme)

**Action** :
1. Acheter 2-4 domaines avec protection WHOIS
2. Activer la protection de confidentialité
3. Vérifier que les infos sont masquées

---

### ÉTAPE 2 : Configuration DNS Multi-Niveaux 🔴

#### Configuration des Domaines Principaux

**Zone DNS pour `atiha-redir-1.com`** :
```
A     @              →  IP_FRONTEND_1 (ex: 98.96.218.35)
A     www            →  IP_FRONTEND_1
CNAME api-gateway    →  IP_BACKEND (ex: 107.151.135.63)
CNAME api            →  IP_BACKEND
```

**Zone DNS pour `atiha-redir-2.com`** (miroir) :
```
A     @              →  IP_FRONTEND_2 (ou même IP pour simplicité)
A     www            →  IP_FRONTEND_2
CNAME api-gateway    →  IP_BACKEND (MÊME IP que domaine 1)
CNAME api            →  IP_BACKEND
```

**Points importants** :
- ✅ Domaines principaux pointent vers IP frontend
- ✅ Sous-domaines API pointent vers IP backend
- ✅ **Même IP backend** pour les deux domaines

---

### ÉTAPE 3 : Hébergement VPS Offshore 🔴

#### Choix du VPS/Cloud

**Fournisseurs recommandés (offshore/anonymes)** :

1. **VPS Anonymes** :
   - **1984 Hosting** (Islande) - Respecte la vie privée
   - **OrangeWebsite** (Islande) - Pas de logs
   - **FlokiNET** (Islande) - Anonymat garanti
   - **Njalla** (Panama) - Hébergement anonyme

2. **Cloud Providers** :
   - **Vultr** (multi-régions, paiement crypto possible)
   - **DigitalOcean** (mais moins anonyme)
   - **Hetzner** (Allemagne/Pays-Bas)
   - **OVH** (offre services offshore)

**Critères de sélection** :
- ✅ Accepte paiement crypto (Bitcoin, Monero)
- ✅ Pas de KYC strict
- ✅ Juridiction offshore (Islande, Panama, etc.)
- ✅ Pas de logs obligatoires
- ✅ Support IPv4 dédié

---

#### Configuration du Serveur Frontend

**IP Frontend** : `98.96.218.35` (exemple)

**Serveur** : Nginx ou Apache en reverse proxy

**Configuration Nginx** :
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name atiha-redir-1.com www.atiha-redir-1.com;
    
    # Redirection vers sous-domaine API
    location / {
        return 301 https://api-gateway.atiha-redir-1.com$request_uri;
    }
    
    # Ou proxy direct vers backend
    location /api/ {
        proxy_pass https://IP_BACKEND_REEL/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

#### Configuration du Serveur Backend API

**IP Backend** : `107.151.135.63` (exemple - différente du frontend)

**Serveur** : Votre application backend (Node.js, Python, etc.)

**Configuration** :
```javascript
// Exemple Node.js/Express
const express = require('express');
const app = express();

// CORS configuré pour accepter les domaines frontend
app.use(cors({
    origin: ['https://atiha-redir-1.com', 'https://atiha-redir-2.com'],
    credentials: true
}));

// Routes API
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok' });
});

// Écoute sur IP backend
app.listen(443, '107.151.135.63');
```

---

### ÉTAPE 4 : Configuration CDN 🔴

#### Option 1 : Cloudflare CDN (RECOMMANDÉ - Gratuit)

**Utiliser Cloudflare comme CDN intégré** :
- ✅ CDN automatique (inclus avec le proxy)
- ✅ Distribution sur 200+ datacenters mondiaux
- ✅ Cache intelligent
- ✅ Bandwidth illimité (plan gratuit)
- ✅ Performance optimale

**Configuration** :
- Activer le proxy Cloudflare (🟠 orange cloud) sur votre domaine
- ✅ CDN activé automatiquement
- Configurer les règles de cache si besoin

**Dans votre SDK** :
```json
{
    "cdn_url": "https://atiha-redir-1.com/cdn/"  // Même domaine Cloudflare
}
```

📚 **Voir** `CLARIFICATION_CDN_CLOUDFLARE.md` pour détails complets

#### Option 2 : CDN Anonyme Séparé (Optionnel)

**Si vous voulez un CDN vraiment "anonyme" séparé** :

**Acheter un domaine pour CDN** :
```
atiha-cdn.anonymous-site.site
```

**Configurer sur VPS séparé** :
- Nginx pour servir les fichiers statiques
- Cache pour les vidéos/contenu
- Distribution géographique possible

**Services possibles** :
- **VPS séparé** avec domaine .site/.xyz
- **BunnyCDN** (payant, anonyme possible)
- **KeyCDN** (payant, configuration anonyme)

**Note** : Cette option ajoute complexité et coûts. Cloudflare CDN est recommandé.

**Configuration** :
```nginx
# Serveur CDN
server {
    listen 80;
    listen 443 ssl;
    server_name atiha-cdn.anonymous-site.site;
    
    # Servir les fichiers statiques/vidéos
    location /content/ {
        root /var/www/cdn;
        # Headers de cache
        add_header Cache-Control "public, max-age=3600";
    }
}
```

---

### ÉTAPE 5 : Configuration de l'Application Mobile 🔴

#### Fichier de Configuration SDK

**Créer** : `assets/sdk_config.json`

```json
{
    "host_list": [
        "https://api-gateway.atiha-redir-1.com",
        "https://api-gateway.atiha-redir-2.com"
    ],
    "cdn_url": "https://atiha-redir-1.com/cdn/",  // Cloudflare CDN intégré
    "backup_hosts": [
        "https://backup-api.atiha-redir-1.com"
    ]
}
```

#### Code Application (Exemple Android/Kotlin)

```kotlin
class ApiClient {
    private val hosts = listOf(
        "https://api-gateway.atiha-redir-1.com",
        "https://api-gateway.atiha-redir-2.com"
    )
    
    private var currentHostIndex = 0
    
    suspend fun makeRequest(endpoint: String): Response {
        var lastException: Exception? = null
        
        // Essayer chaque host (failover)
        for (host in hosts) {
            try {
                return httpClient.get("$host$endpoint")
            } catch (e: Exception) {
                lastException = e
                currentHostIndex = (currentHostIndex + 1) % hosts.size
            }
        }
        throw lastException ?: Exception("All hosts failed")
    }
}
```

---

### ÉTAPE 6 : Protection et Obfuscation 🔴

#### Obfuscation du Code

**Android** :
1. **R8/ProGuard** : Minification et obfuscation
2. **DexGuard** : Protection avancée (payant)
3. **Jiagu SDK** : Protection chinoise (comme FreeCine)
4. **String Encryption** : Chiffrer les URLs en dur

**Configuration ProGuard** :
```proguard
# Obfuscation
-dontobfuscate
-keep class com.atiha.** { *; }

# Chiffrer les strings sensibles
-keepclassmembers class * {
    private static final java.lang.String API_URL;
}
```

#### Protection des URLs

**Ne JAMAIS coder en dur** :
```kotlin
// ❌ MAUVAIS
val apiUrl = "https://api-gateway.atiha-redir-1.com"

// ✅ BON - Récupéré dynamiquement
val apiUrl = getApiUrlFromConfig() // Depuis assets/sdk_config.json
```

---

### ÉTAPE 7 : Redirections et Routing 🔴

#### Serveur Frontend (Nginx)

**Configuration complète** :
```nginx
# Serveur Frontend - Redirection intelligente
upstream backend_api {
    server 107.151.135.63:443;
    # backup servers possible
}

server {
    listen 80;
    listen 443 ssl;
    server_name atiha-redir-1.com www.atiha-redir-1.com;
    
    # Redirection API vers backend
    location /api/ {
        proxy_pass https://backend_api;
        proxy_set_header Host api-gateway.atiha-redir-1.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_ssl_verify off;
    }
    
    # Redirection contenu vers CDN
    location /content/ {
        return 301 https://atiha-cdn.anonymous-site.site$request_uri;
    }
    
    # Page d'accueil générique (optionnel)
    location / {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

---

### ÉTAPE 8 : Infrastructure Réelle (VPS Offshore) 🔴

#### VPS Backend Principal

**Localisation** : Islande, Panama, ou pays offshore

**Configuration** :
- ✅ **Sans logs** : Désactiver les logs système
- ✅ **Firewall** : Autoriser uniquement les IPs frontend
- ✅ **Chiffrement** : SSL/TLS obligatoire
- ✅ **Isolation** : Aucune info sur l'IP visible publiquement

**Firewall (UFW)** :
```bash
# Autoriser uniquement les IPs frontend
ufw allow from 98.96.218.35 to any port 443
ufw allow from IP_FRONTEND_2 to any port 443
ufw deny 443
ufw enable
```

**Désactivation des logs** :
```bash
# Nginx - Désactiver access logs
# Dans nginx.conf
access_log off;
error_log /dev/null crit;
```

---

### ÉTAPE 9 : Sécurité et Anonymat Avancés 🔴

#### 1. Domain Fronting (Avancé)

**Technique** : Utiliser un domaine légitime pour masquer le trafic réel

**Exemple** :
- Domaine légitime : `atiha-legitimate.com`
- Domaine réel : `atiha-real.com`
- Le trafic passe par `atiha-legitimate.com` mais va vers `atiha-real.com`

**Implémentation** :
- Utiliser SNI (Server Name Indication) pour le masquage
- Configuration complexe, nécessite support du CDN

---

#### 2. Proxy Chains

**Architecture** :
```
App → Proxy 1 → Proxy 2 → Backend Réel
```

**Services de proxy** :
- **Cloudflare Workers** (gratuit, anonyme)
- **VPS Proxy intermédiaires**
- **Tor** (trop lent pour production)

---

#### 3. TLS Fingerprinting Evasion

**Masquer les empreintes TLS** :
- Utiliser des bibliothèques standard
- Éviter les implémentations custom
- Rotation des certificats SSL

---

### ÉTAPE 10 : Monitoring et Maintenance 🔴

#### Monitoring Discret

**Outils** :
- **Uptime monitoring** : UptimeRobot, Pingdom
- **Logs anonymes** : Aucune IP source
- **Analytics** : Pas de tracking utilisateur

#### Rotation des Domaines

**Stratégie** :
- Acheter plusieurs domaines
- Rotation périodique (tous les 6-12 mois)
- Migration progressive

---

## 📋 Checklist Complète

### ✅ Domaine & DNS
- [ ] Acheter 2-4 domaines avec protection WHOIS
- [ ] Configurer DNS avec sous-domaines
- [ ] Vérifier masquage WHOIS
- [ ] Configurer failover DNS

### ✅ Infrastructure
- [ ] VPS Frontend configuré (IP: X.X.X.X)
- [ ] VPS Backend configuré (IP: Y.Y.Y.Y - différente)
- [ ] VPS CDN configuré (si nécessaire)
- [ ] VPS Infrastructure réelle offshore

### ✅ Sécurité
- [ ] SSL/TLS sur tous les serveurs
- [ ] Firewall configuré
- [ ] Logs désactivés
- [ ] Obfuscation code activée

### ✅ Application
- [ ] Configuration SDK avec host_list
- [ ] Failover implémenté
- [ ] URLs dynamiques (pas en dur)
- [ ] Protection anti-analyse

### ✅ CDN
- [ ] CDN configuré (si nécessaire)
- [ ] Distribution géographique
- [ ] Cache configuré

---

## 🔧 Exemples de Configuration

### Configuration Frontend (Nginx)

```nginx
# /etc/nginx/sites-available/atiha-frontend
server {
    listen 80;
    listen 443 ssl http2;
    
    server_name atiha-redir-1.com www.atiha-redir-1.com;
    
    # Certificat SSL
    ssl_certificate /etc/letsencrypt/live/atiha-redir-1.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/atiha-redir-1.com/privkey.pem;
    
    # Désactiver les logs
    access_log off;
    error_log /dev/null crit;
    
    # Masquer les headers serveur
    server_tokens off;
    more_set_headers 'Server: nginx/1.0.0';
    
    # Redirection API
    location /api/ {
        proxy_pass https://107.151.135.63;
        proxy_set_header Host api-gateway.atiha-redir-1.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Masquer l'IP backend
        proxy_hide_header Server;
    }
    
    # Redirection CDN
    location /cdn/ {
        return 301 https://atiha-cdn.anonymous-site.site$request_uri;
    }
    
    # Health check
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

---

### Configuration Backend (Nginx + Application)

```nginx
# /etc/nginx/sites-available/atiha-backend
server {
    listen 443 ssl http2;
    
    # Écouter uniquement sur IP backend
    listen 107.151.135.63:443 ssl http2;
    
    server_name api-gateway.atiha-redir-1.com api-gateway.atiha-redir-2.com;
    
    # Désactiver les logs
    access_log off;
    error_log /dev/null crit;
    
    # Firewall via Nginx
    allow 98.96.218.35;  # IP Frontend 1
    allow IP_FRONTEND_2;  # IP Frontend 2
    deny all;
    
    # Proxy vers application backend
    location / {
        proxy_pass http://127.0.0.1:3000;  # Votre app Node.js/Python
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### Code Application (Android/Kotlin)

```kotlin
// ConfigManager.kt
object ConfigManager {
    private val configFile = "assets/sdk_config.json"
    
    private val defaultHosts = listOf(
        "https://api-gateway.atiha-redir-1.com",
        "https://api-gateway.atiha-redir-2.com"
    )
    
    fun getApiHost(): String {
        // Lire depuis config ou utiliser défaut
        val config = loadConfig()
        return config.hosts.random()  // Load balancing
    }
    
    fun getCdnUrl(): String {
        return "https://atiha-cdn.anonymous-site.site"
    }
}

// ApiClient.kt
class ApiClient {
    private val httpClient = HttpClient {
        engine {
            // Configuration HTTPS
            config {
                trustManager = object : X509TrustManager {
                    override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
                    override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}
                    override fun getAcceptedIssuers() = arrayOf<X509Certificate>()
                }
            }
        }
    }
    
    suspend fun fetchData(endpoint: String): ApiResponse {
        var lastError: Exception? = null
        
        // Essayer chaque host
        for (host in ConfigManager.getHosts()) {
            try {
                val response = httpClient.get("$host$endpoint") {
                    headers {
                        append("User-Agent", "AtihaApp/1.0")
                    }
                }
                return response.body<ApiResponse>()
            } catch (e: Exception) {
                lastError = e
                // Logger silencieusement, continuer vers prochain host
            }
        }
        
        throw lastError ?: Exception("All API hosts failed")
    }
}
```

---

## 🔒 Sécurité Avancée

### 1. Certificate Pinning (Optionnel mais Recommandé)

```kotlin
// Pin les certificats SSL pour éviter MITM
val certificatePinner = CertificatePinner.Builder()
    .add("api-gateway.atiha-redir-1.com", "sha256/XXXXXXXXXXXXXXXX")
    .add("api-gateway.atiha-redir-2.com", "sha256/XXXXXXXXXXXXXXXX")
    .build()
```

### 2. Obfuscation des Strings

```kotlin
// Au lieu de
val url = "https://api-gateway.atiha-redir-1.com"

// Utiliser
val url = decryptString(encryptedUrlFromAssets)
```

### 3. Détection d'Emulation/Debug

```kotlin
if (isEmulator() || isDebugging()) {
    // Comportement différent ou blocage
    throw SecurityException("Debug mode not allowed")
}
```

---

## 📊 Architecture Recommandée pour Atiha

### Version Simplifiée (Recommandée pour débuter)

```
App Atiha
    ↓
api-gateway.atiha-1.com (Frontend VPS)
    ↓
VPS Backend (Offshore) - IP masquée
    ↓
CDN (Optionnel)
```

**3 Composants minimum** :
1. **Domaines avec protection WHOIS**
2. **VPS Frontend** (reverse proxy)
3. **VPS Backend** (application réelle)

---

### Version Complète (Comme FreeCine)

```
App Atiha
    ↓
Domaine 1 (Frontend) + Domaine 2 (Miroir)
    ↓
API Gateway (Backend) - IP différente
    ↓
CDN Anonyme
    ↓
VPS Offshore (Infrastructure réelle)
```

**5+ Composants** :
1. **2+ Domaines** (redondance)
2. **VPS Frontend** (2 IPs)
3. **VPS Backend** (IP différente)
4. **CDN** (distribution)
5. **VPS Réel** (offshore, masqué)

---

## 💰 Coûts Estimés

### Version Simplifiée (AVEC Cloudflare Gratuit) - RECOMMANDÉ
- **Domaines** : ~$20-40/an (2 domaines + protection)
- **Hébergement Frontend** : **0€/mois** (Cloudflare gratuit)
- **VPS Backend** : ~$15-25/mois (1 seul VPS suffit avec Cloudflare)
- **SSL** : Gratuit (Cloudflare auto)
- **Total** : ~$200-340/an ✅

📚 **Voir** `GUIDE_VPS_ARCHITECTURE.md` pour détails complets sur l'architecture VPS

### Version Simplifiée (SANS Cloudflare - VPS Frontend)
- **Domaines** : ~$20-40/an (2 domaines + protection)
- **VPS Frontend** : ~$5-10/mois
- **VPS Backend** : ~$10-20/mois
- **SSL** : Gratuit (Let's Encrypt)
- **Total** : ~$180-360/an

### Version Complète (AVEC Cloudflare Gratuit)
- **Domaines** : ~$80-160/an (4+ domaines)
- **Hébergement Redirection** : **0€/mois** (Cloudflare Workers gratuit)
- **VPS Backend** : ~$20-40/mois
- **CDN** : **0€/mois** (Cloudflare CDN intégré) ou ~$10-50/mois (optionnel)
- **VPS Offshore** : ~$30-60/mois
- **Total** : ~$600-1560/an ✅

### Version Complète (SANS Cloudflare - Tout VPS)
- **Domaines** : ~$80-160/an (4+ domaines)
- **VPS Frontend** : ~$20-40/mois (2 serveurs)
- **VPS Backend** : ~$20-40/mois
- **CDN** : ~$10-50/mois
- **VPS Offshore** : ~$30-60/mois
- **Total** : ~$960-2520/an

---

## 🚨 Points d'Attention

### Légalité
- ⚠️ Vérifier les lois locales
- ⚠️ Respecter les droits d'auteur
- ⚠️ Conformité RGPD si nécessaire

### Performance
- ✅ CDN pour réduire latence
- ✅ Cache pour optimisation
- ✅ Load balancing pour disponibilité

### Maintenance
- ✅ Monitoring discret
- ✅ Sauvegarde des configurations
- ✅ Plan de migration/rotation

---

## 📚 Ressources

### Services Recommandés

**Domaines** :
- Namecheap (WhoisGuard inclus)
- NameSilo (Privacy Protection)
- Njalla (Anonyme, paiement crypto)

**VPS Offshore** :
- 1984 Hosting (Islande)
- OrangeWebsite (Islande)
- FlokiNET (Islande)
- Njalla (Panama)

**CDN / Hébergement Redirection** :
- **Cloudflare** (100% gratuit - RECOMMANDÉ)
  - DNS gratuit
  - Workers (proxy/redirection) : 100k requêtes/jour gratuit
  - SSL automatique
  - CDN intégré
  - 📚 Voir `GUIDE_HEBERGEMENT_REDIRECTION.md` pour détails complets
- Netlify (gratuit - 100GB/mois)
- Vercel (gratuit - 100GB/mois)
- BunnyCDN (payant)
- KeyCDN (payant)
- Fastly (payant - $50+/mois)

**Outils** :
- Nginx (reverse proxy)
- Certbot (SSL gratuit)
- Fail2ban (sécurité)

---

**Date de création** : $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Version** : 1.0

