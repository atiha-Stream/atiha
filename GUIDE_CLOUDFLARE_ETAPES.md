# 🚀 Guide Pas à Pas : Configuration Cloudflare pour Atiha

## 📋 Vue d'Ensemble du Processus

```
1. Créer compte Cloudflare (gratuit)
2. Acheter/avoir un domaine (ex: atiha-redir-1.com)
3. Ajouter le domaine dans Cloudflare
4. Configurer les DNS dans Cloudflare
5. (Optionnel) Créer un Worker pour redirection
6. ✅ Terminé !
```

---

## 🔴 ÉTAPE 1 : Créer le Compte Cloudflare

### A. Aller sur Cloudflare

1. Ouvrir [cloudflare.com/fr-fr](https://www.cloudflare.com/fr-fr/)
2. Cliquer sur **"Essayer l'offre gratuite"** (bouton orange en haut à droite)
   - OU cliquer sur **"S'inscrire"**

### B. Inscription

1. Entrer votre **email**
2. Choisir un **mot de passe**
3. Cliquer **"S'inscrire"**
4. Vérifier votre email (lien de confirmation)
5. ✅ **Compte créé !**

**Important** : Pas besoin de carte bancaire pour le plan gratuit.

---

## 🔴 ÉTAPE 2 : Vous Devez Avoir un Domaine

⚠️ **ATTENTION** : Avant d'ajouter dans Cloudflare, vous devez **déjà avoir acheté le domaine** chez un registrar (Namecheap, NameSilo, GoDaddy, etc.).

**Exemples de domaines** :
- `atiha-redir-1.com`
- `atiha-redir-2.com`

**Où acheter** :
- Namecheap (WhoisGuard inclus)
- NameSilo (Privacy Protection)
- GoDaddy
- Cloudflare Registrar (optionnel - directement dans Cloudflare)

---

## 🔴 ÉTAPE 3 : Ajouter le Domaine dans Cloudflare

### A. Ajouter un Site

1. Dans le **dashboard Cloudflare**, cliquer sur **"Ajouter un site"** (bouton bleu)
2. Entrer votre domaine : `atiha-redir-1.com`
3. Cliquer **"Ajouter le site"**

### B. Choisir le Plan

1. Cloudflare propose plusieurs plans :
   - ✅ **Gratuit** (Free) - **CHOISIR CELUI-CI**
   - Pro ($20/mois)
   - Business ($200/mois)
   - Enterprise (sur mesure)

2. Cliquer sur **"Continuer avec le plan Gratuit"** (ou "Free")

### C. Cloudflare Scanne vos DNS

1. Cloudflare scanne automatiquement vos enregistrements DNS actuels
2. Il montre ce qu'il a trouvé (A, CNAME, MX, etc.)
3. Vérifier que tout est correct
4. Cliquer **"Continuer"**

---

## 🔴 ÉTAPE 4 : Mettre à Jour les Nameservers

⚠️ **CRUCIAL** : Vous devez dire à votre registrar d'utiliser les serveurs DNS de Cloudflare.

### A. Copier les Nameservers Cloudflare

Cloudflare vous donne 2 nameservers, par exemple :
```
nathan.ns.cloudflare.com
ruth.ns.cloudflare.com
```

**IMPORTANT** : Copier ces 2 noms exactement.

### B. Aller sur Votre Registrar

1. Se connecter à votre registrar (Namecheap, NameSilo, etc.)
2. Aller dans la gestion du domaine `atiha-redir-1.com`
3. Chercher **"Nameservers"** ou **"Serveurs de noms"**

### C. Remplacer les Nameservers

**AVANT** (nameservers du registrar) :
```
ns1.registrar.com
ns2.registrar.com
```

**APRÈS** (nameservers Cloudflare - à copier) :
```
nathan.ns.cloudflare.com
ruth.ns.cloudflare.com
```

**Sauvegarder** les modifications.

### D. Attendre la Propagation

⏱️ **Temps d'attente** : 5 minutes à 24 heures (généralement 15-30 min)

**Comment vérifier** :
```bash
# Commande dans PowerShell
nslookup -type=NS atiha-redir-1.com
```

Si vous voyez les nameservers Cloudflare, c'est bon ! ✅

---

## 🔴 ÉTAPE 5 : Configurer les DNS dans Cloudflare

Une fois les nameservers propagés, retourner dans Cloudflare.

### A. Aller dans DNS

1. Dans le dashboard Cloudflare
2. Cliquer sur votre domaine `atiha-redir-1.com`
3. Aller dans l'onglet **"DNS"** (menu de gauche)

### B. Configurer les Enregistrements DNS

**Configuration pour Architecture Anonyme** :

#### Enregistrement 1 : Domaine Principal (Frontend)

```
Type    : A
Nom     : @ (ou atiha-redir-1.com)
Contenu : IP_FRONTEND (ex: 98.96.218.35)
Proxy   : 🟠 Proxied (ON - orange cloud)
TTL     : Auto
```

#### Enregistrement 2 : WWW (Frontend)

```
Type    : A
Nom     : www
Contenu : IP_FRONTEND (même IP que ci-dessus)
Proxy   : 🟠 Proxied (ON - orange cloud)
TTL     : Auto
```

#### Enregistrement 3 : API Gateway (Backend)

```
Type    : CNAME (ou A si IP directe)
Nom     : api-gateway
Contenu : IP_BACKEND (ex: 107.151.135.63)
Proxy   : ⚪ DNS Only (OFF - gris cloud)
TTL     : Auto
```

**Pourquoi** :
- 🟠 **Proxied (ON)** : Pour les domaines frontend (masquage IP + protection DDoS)
- ⚪ **DNS Only (OFF)** : Pour les sous-domaines API (accès direct au backend)

### C. Sauvegarder

1. Cliquer **"Ajouter un enregistrement"** pour chaque ligne
2. ✅ Les enregistrements apparaissent dans la liste

---

## 🔴 ÉTAPE 6 : Activer SSL (Automatique)

1. Aller dans **"SSL/TLS"** (menu de gauche)
2. Choisir **"Complet (strict)"** ou **"Complet"**
3. ✅ SSL activé automatiquement

**Note** : Cloudflare génère les certificats automatiquement (pas besoin de Let's Encrypt).

---

## 🔴 ÉTAPE 7 (Optionnel) : Créer un Worker pour Redirection

Si vous voulez une redirection/proxy avancée :

### A. Créer un Worker

1. Dans le dashboard, aller **"Workers & Pages"**
2. Cliquer **"Créer un worker"** ou **"Create Worker"**
3. Nommer : `atiha-redirect` (ou autre nom)

### B. Coller le Code

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Redirection API vers backend
  if (url.pathname.startsWith('/api/')) {
    const backendUrl = `https://VOTRE_IP_BACKEND${url.pathname}`
    return fetch(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })
  }
  
  // Page d'accueil simple
  if (url.pathname === '/') {
    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
  
  // Redirection par défaut
  return Response.redirect('https://api-gateway.atiha-redir-1.com', 301)
}
```

**Remplacer** : `VOTRE_IP_BACKEND` par votre IP backend réelle.

### C. Déployer

1. Cliquer **"Enregistrer et déployer"** ou **"Save and Deploy"**
2. ✅ Worker créé

### D. Ajouter une Route

1. Dans le Worker, aller **"Triggers"** ou **"Déclencheurs"**
2. Cliquer **"Ajouter une route"** ou **"Add route"**
3. Route : `atiha-redir-1.com/*` (ou `*.atiha-redir-1.com/*`)
4. Worker : `atiha-redirect`
5. ✅ Route active

---

## ✅ Vérification Finale

### Tester la Configuration

1. **Tester DNS** :
   ```powershell
   nslookup atiha-redir-1.com
   # Doit retourner IP_FRONTEND
   ```

2. **Tester HTTPS** :
   ```
   Ouvrir : https://atiha-redir-1.com
   Doit afficher : "OK" ou votre page
   ```

3. **Tester SSL** :
   - Le cadenas 🔒 doit être vert dans le navigateur
   - URL doit commencer par `https://`

---

## 📊 Résumé : Ce Qui Se Passe

```
┌─────────────────────────────────────────┐
│  1. Vous avez un domaine                │
│     (acheté chez Namecheap, etc.)       │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  2. Vous créez un compte Cloudflare     │
│     (gratuit, pas de carte bancaire)    │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  3. Vous "ajoutez" le domaine dans      │
│     Cloudflare (connecter, pas créer)   │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  4. Cloudflare vous donne des           │
│     nameservers à copier                │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  5. Vous mettez à jour les nameservers  │
│     chez votre registrar                │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  6. Vous configurez les DNS dans        │
│     Cloudflare (A, CNAME, etc.)         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  7. (Optionnel) Vous créez un Worker    │
│     pour redirection/proxy              │
└─────────────────┬───────────────────────┘
                  │
                  ↓
            ✅ TERMINÉ !
```

---

## ❓ Questions Fréquentes

### Q : Est-ce que je "crée" un site sur Cloudflare ?
**R** : Non, vous **connectez** votre domaine existant à Cloudflare. Le site reste sur votre VPS/backend, Cloudflare sert de proxy/redirection.

### Q : Dois-je héberger le site sur Cloudflare ?
**R** : Non. Cloudflare est un **proxy** qui :
- Cache le contenu
- Protège contre DDoS
- Gère les DNS
- Permet redirections via Workers

Votre site réel reste sur votre VPS backend.

### Q : Cloudflare va-t-il stocker mon contenu ?
**R** : Oui, mais seulement en cache (temporaire). Le contenu réel reste sur votre VPS.

### Q : Puis-je utiliser plusieurs domaines ?
**R** : Oui, ajouter chaque domaine séparément dans Cloudflare (tous gratuits).

### Q : Combien ça coûte ?
**R** : **0€/mois** pour le plan gratuit (100k requêtes Workers/jour).

---

## 🚨 Points Importants

1. ✅ **Acheter le domaine D'ABORD** (chez Namecheap, etc.)
2. ✅ **Créer compte Cloudflare** (gratuit)
3. ✅ **Ajouter le domaine** dans Cloudflare (pas créer)
4. ✅ **Mettre à jour nameservers** chez registrar
5. ✅ **Configurer DNS** dans Cloudflare
6. ✅ **SSL automatique** (pas de config)

---

**Date de création** : $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Version** : 1.0

