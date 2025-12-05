# 🔒 Configuration HTTPS-Terminée

## ✅ Ce qui a été implémenté

### 1. **Redirection HTTP → HTTPS forcée**
- ✅ Redirection automatique en production (301 Permanent Redirect)
- ✅ Détection HTTPS via headers proxy (`x-forwarded-proto`)
- ✅ Exclusions pour localhost (développement)

### 2. **Headers de sécurité HTTPS**
- ✅ **HSTS** (HTTP Strict Transport Security) : Force HTTPS pendant 1 an
- ✅ **X-Content-Type-Options** : Empêche le MIME sniffing
- ✅ **X-Frame-Options** : Protection contre le clickjacking
- ✅ **X-XSS-Protection** : Protection XSS legacy
- ✅ **Referrer-Policy** : Contrôle des informations de référent
- ✅ **Permissions-Policy** : Désactive les fonctionnalités non nécessaires
- ✅ **Content-Security-Policy** : Politique de sécurité du contenu (basique)

### 3. **Fichiers modifiés**
- `middleware.ts` : Redirection HTTPS + headers de sécurité
- `next.config.js` : Headers de sécurité HTTPS en production

---

## 📋 Configuration SSL/HTTPS pour la production

### Option 1 : Let's Encrypt (Gratuit & Recommandé)

#### Prérequis
- Serveur avec accès root
- Nom de domaine configuré
- Ports 80 et 443 ouverts

#### Installation avec Certbot

```bash
# Installation de Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx  # Pour Nginx
# OU
sudo apt install certbot python3-certbot-apache  # Pour Apache

# Génération du certificat
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Test du renouvellement automatique
sudo certbot renew --dry-run
```

Certbot configure automatiquement :
- ✅ Le certificat SSL
- ✅ Le renouvellement automatique (crontab)
- ✅ La redirection HTTPS dans Nginx/Apache

---

### Option 2 : Vercel/Next.js Cloud (Automatique)

Si vous déployez sur **Vercel** :
- ✅ HTTPS est activé **automatiquement**
- ✅ Certificats SSL gérés par Vercel
- ✅ Renouvellement automatique
- ✅ Redirection HTTPS automatique

Aucune configuration supplémentaire nécessaire !

---

### Option 3 : Cloudflare (Gratuit & Recommandé)

Si vous utilisez **Cloudflare** comme proxy :
1. Activez Cloudflare sur votre domaine
2. Configurez les DNS
3. Activez "SSL/TLS" → "Full (strict)" dans Cloudflare
4. Cloudflare gère automatiquement :
   - ✅ Certificats SSL
   - ✅ Renouvellement automatique
   - ✅ Redirection HTTPS

**Note** : Si vous utilisez Cloudflare, le middleware détectera automatiquement HTTPS via le header `x-forwarded-proto`.

---

### Option 4 : Nginx Reverse Proxy (Self-hosted)

Configuration Nginx exemple :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Redirection HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy vers Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # ⚠️ IMPORTANT pour HTTPS
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Important** : Le header `X-Forwarded-Proto` est **essentiel** pour que le middleware détecte correctement HTTPS.

---

### Option 5 : Docker avec Nginx

Si vous utilisez Docker :

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl  # Certificats SSL
    depends_on:
      - nextjs
      
  nextjs:
    build: .
    environment:
      - NODE_ENV=production
```

---

## 🔍 Vérification HTTPS

### 1. Vérifier la redirection HTTP → HTTPS
```bash
curl -I http://votre-domaine.com
# Devrait retourner : HTTP/1.1 301 Moved Permanently
# Location: https://votre-domaine.com
```

### 2. Vérifier les headers de sécurité
```bash
curl -I https://votre-domaine.com
# Devrait inclure :
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

### 3. Tester avec SSL Labs
Visitez : https://www.ssllabs.com/ssltest/analyze.html?d=votre-domaine.com

Objectif : **Note A ou A+**

---

## ⚙️ Configuration de l'environnement qual

### Variables d'environnement recommandées

Ajoutez dans votre `.env.production` :

```env
# Mode production
NODE_ENV=production

# URL de l'application (HTTPS)
NEXT_PUBLIC_APP_URL=https://votre-domaine.com

# Force HTTPS (optionnel, déjà géré par le middleware)
FORCE_HTTPS=true
```

---

## 🚨 Troubleshooting

### Problème : Redirection en boucle infinie

**Cause** : Le proxy ne transmet pas `X-Forwarded-Proto`

**Solution** :
1. Vérifiez que votre proxy (Nginx/Cloudflare) envoie le header `X-Forwarded-Proto: https`
2. Si vous utilisez Cloudflare, activez "SSL/TLS" → "Full (strict)"
3. Si vous utilisez Nginx, ajoutez : `proxy_set_header X-Forwarded-Proto $scheme;`

---

### Problème : Certificat SSL invalide

**Causes possibles** :
- Certificat expiré
- Nom de domaine ne correspond pas
- Certificat auto-signé Rousseau (non reconnu)

**Solutions** :
- Utilisez Let's Encrypt (gratuit et reconnu)
- Vérifiez la date d'expiration : `openssl x509 -in certificat.pem -noout -dates`
- Renouvelez avec : `sudo certbot renew`

---

### Problème : HSTS bloque l'accès en HTTP

**Cause** : HSTS est activé et le navigateur a mémorisé la politique HTTPS

**Solution** :
1. Supprimez le domaine de la liste HSTS du navigateur :
   - Chrome : `chrome://net-internals/#hsts`
   - Firefox : Effacez les cookies et données de site
2. Réduisez temporairement `max-age` dans le header HSTS

---

## 📝 Notes importantes

1. **Développement local** : HTTPS n'est **pas forcé** sur `localhost` pour faciliter le développement
2. **Production uniquement** : Les headers de sécurité HTTPS sont ajoutés uniquement en production (`NODE_ENV=production`)
3. **Renouvellement automatique** : Let's Encrypt renouvelle automatiquement les certificats (valides 90 jours)
4. **HSTS Preload** : Pour ajouter votre domaine à la liste HSTS des navigateurs, soumettez-le sur https://hstspreload.org/

---

## ✅ Checklist de déploiement HTTPS

- [ ] Certificat SSL installé et valide
- [ ] Redirection HTTP → HTTPS fonctionnelle
- [ ] Headers de sécurité présents (vérifier avec `curl -I`)
- [ ] Test SSL Labs : Note A ou A+
- [ ] Renouvellement automatique configuré (Let's Encrypt)
- [ ] Variables d'environnement `NODE_ENV=production` et `NEXT_PUBLIC_APP_URL=https://...`
- [ ] Proxy configuré avec `X-Forwarded-Proto` si nécessaire
- [ ] Test sur plusieurs navigateurs (Chrome, Firefox, Safari)

---

## 🎉 Résultat final

Votre application Next.js est maintenant :
- ✅ Accessible uniquement via HTTPS en production
- ✅ Protégée avec des headers de sécurité modernes
- ✅ Conforme aux bonnes pratiques de sécurité web
- ✅ Prête pour la mise en production sécurisée

---

**Documentation créée le** : $(date)
**Dernière mise à jour** : Configuration HTTPS complète

