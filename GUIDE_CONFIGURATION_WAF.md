# 🛡️ Guide de Configuration WAF (Web Application Firewall)

**Date:** 2025-11-22  
**Statut:** 📋 Guide de configuration

---

## 📋 Vue d'Ensemble

Un WAF (Web Application Firewall) filtre le trafic HTTP/HTTPS avant qu'il n'atteigne votre application, bloquant les attaques courantes comme :
- Injections SQL (SQLi)
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- DDoS (Distributed Denial of Service)
- Bots malveillants
- Requêtes suspectes

---

## 🎯 Option 1 : Cloudflare (Recommandé)

### Avantages
- ✅ **Gratuit** pour les sites personnels (plan Free)
- ✅ **Facile à configurer** (15-30 minutes)
- ✅ **Protection DDoS** incluse
- ✅ **CDN** inclus (améliore les performances)
- ✅ **SSL automatique** (certificats gratuits)
- ✅ **Analytics** intégrés

### Étapes de Configuration

#### 1. Créer un Compte Cloudflare

1. Aller sur https://cloudflare.com
2. Cliquer sur "Sign Up"
3. Créer un compte avec votre email

#### 2. Ajouter Votre Domaine

1. Dans le dashboard Cloudflare, cliquer sur "Add a Site"
2. Entrer votre domaine (ex: `atiha.com`)
3. Choisir le plan **Free** (suffisant pour la plupart des cas)
4. Cloudflare va scanner vos enregistrements DNS

#### 3. Changer les DNS

1. Cloudflare vous donnera **2 serveurs de noms** (ex: `ns1.cloudflare.com` et `ns2.cloudflare.com`)
2. Aller dans votre registrar (où vous avez acheté le domaine)
3. Remplacer les serveurs DNS actuels par ceux de Cloudflare
4. Attendre 24-48h pour la propagation DNS (généralement moins)

#### 4. Activer le WAF

1. Dans le dashboard Cloudflare, aller dans **Security** → **WAF**
2. Activer le WAF (gratuit pour les règles de base)
3. Configurer les règles :

##### Règles de Base (Gratuites)

**a) Bloquer les Pays Spécifiques (si restriction géographique)**
```
Security → WAF → Custom Rules
Créer une règle :
- Name: "Block Restricted Countries"
- Field: Country
- Operator: is not in
- Value: [Liste des pays autorisés]
- Action: Block
```

**b) Protection contre SQL Injection**
```
Security → WAF → Managed Rules
Activer: "Cloudflare Managed Ruleset"
```

**c) Protection contre XSS**
```
Security → WAF → Managed Rules
Activer: "Cloudflare OWASP Core Ruleset"
```

**d) Bloquer les Bots Malveillants**
```
Security → Bots
Activer: "Bot Fight Mode" (gratuit)
```

#### 5. Configurer les Rate Limits

1. Aller dans **Security** → **Rate Limiting**
2. Créer une règle :
   - **Rule name:** "API Rate Limit"
   - **Match:** URI Path contains `/api/`
   - **Requests:** 60
   - **Period:** 1 minute
   - **Action:** Block

3. Créer une autre règle pour le login admin :
   - **Rule name:** "Admin Login Rate Limit"
   - **Match:** URI Path equals `/admin/login`
   - **Requests:** 5
   - **Period:** 5 minutes
   - **Action:** Block

#### 6. Configurer le SSL/TLS

1. Aller dans **SSL/TLS**
2. Choisir **Full (strict)** pour forcer HTTPS
3. Activer **Always Use HTTPS**
4. Activer **Automatic HTTPS Rewrites**

#### 7. Tester la Configuration

1. Essayer d'accéder à votre site via HTTP → doit rediriger vers HTTPS
2. Essayer une requête suspecte (ex: `?id=1' OR '1'='1`) → doit être bloquée
3. Vérifier les logs dans **Security** → **Events**

---

## 🎯 Option 2 : AWS WAF

### Avantages
- ✅ **Intégration AWS** native
- ✅ **Règles personnalisées** avancées
- ✅ **Scalabilité** automatique
- ⚠️ **Payant** (mais très abordable : ~5-20€/mois)

### Prérequis

- Compte AWS
- Application déployée sur AWS (EC2, CloudFront, ALB, etc.)

### Étapes de Configuration

#### 1. Créer un CloudFront Distribution (si pas déjà fait)

1. Aller dans AWS Console → **CloudFront**
2. Créer une distribution
3. Configurer l'origine (votre serveur)

#### 2. Créer un WAF Web ACL

1. Aller dans AWS Console → **WAF & Shield**
2. Cliquer sur **Web ACLs**
3. Cliquer sur **Create web ACL**
4. Choisir **CloudFront** comme ressource
5. Configurer les règles :

##### Règles AWS Managed

**a) Protection de Base**
- Activer **AWSManagedRulesCommonRuleSet**
- Activer **AWSManagedRulesKnownBadInputsRuleSet**
- Activer **AWSManagedRulesLinuxRuleSet**
- Activer **AWSManagedRulesSQLiRuleSet**

**b) Protection Avancée**
- Activer **AWSManagedRulesUnixRuleSet**
- Activer **AWSManagedRulesWordPressRuleSet** (si WordPress)

#### 3. Configurer les Rate Limits

1. Créer une règle personnalisée :
   - **Rule name:** "API Rate Limit"
   - **Type:** Rate-based rule
   - **Rate limit:** 2000 requests per 5 minutes
   - **IP address to use:** Source IP address

#### 4. Associer le WAF à CloudFront

1. Dans CloudFront, sélectionner votre distribution
2. Aller dans l'onglet **Behaviors**
3. Modifier le behavior par défaut
4. Dans **AWS WAF Web ACL**, sélectionner votre Web ACL

#### 5. Tester

1. Essayer des requêtes suspectes
2. Vérifier les logs dans **CloudWatch Logs**

---

## 📊 Monitoring et Logs

### Cloudflare

1. **Security Events**
   - Aller dans **Security** → **Events**
   - Voir toutes les requêtes bloquées
   - Filtrer par type d'attaque, pays, IP, etc.

2. **Analytics**
   - Aller dans **Analytics** → **Security**
   - Voir les statistiques d'attaques
   - Graphiques de tendances

### AWS WAF

1. **CloudWatch Logs**
   - Activer les logs dans le Web ACL
   - Configurer un groupe de logs CloudWatch
   - Créer des alarmes pour les attaques

2. **AWS WAF Logs**
   - Aller dans **WAF & Shield** → **Logging**
   - Activer les logs pour votre Web ACL

---

## 🔧 Intégration avec l'Application

### Logger les Événements WAF

Créer un service pour logger les événements WAF dans votre application :

```typescript
// src/lib/waf-logger.ts
export class WAFLogger {
  static logBlockedRequest(ip: string, reason: string, path: string) {
    // Logger dans votre système de logs
    logger.warn('Requête bloquée par WAF', {
      ip,
      reason,
      path,
      timestamp: new Date()
    })
  }
}
```

### Headers WAF

Les WAF ajoutent des headers aux requêtes :

- **Cloudflare:**
  - `CF-Connecting-IP`: IP réelle du client
  - `CF-Ray`: ID de requête Cloudflare
  - `CF-IPCountry`: Pays du client

- **AWS WAF:**
  - `X-Forwarded-For`: IP du client
  - `X-Amzn-Trace-Id`: ID de trace AWS

Utiliser ces headers dans votre application pour logger les IPs réelles.

---

## ⚠️ Points d'Attention

### 1. Faux Positifs

Les WAF peuvent parfois bloquer des requêtes légitimes :
- **Solution:** Créer des exceptions pour les chemins spécifiques
- **Exemple:** Exclure `/api/health` du rate limiting

### 2. Performance

Les WAF ajoutent une latence (généralement < 50ms) :
- **Cloudflare:** Latence minimale grâce au CDN
- **AWS WAF:** Latence légèrement plus élevée

### 3. Coûts

- **Cloudflare Free:** Gratuit (suffisant pour la plupart)
- **Cloudflare Pro:** $20/mois (règles avancées)
- **AWS WAF:** ~$5-20/mois selon le trafic

---

## ✅ Checklist de Configuration

### Cloudflare

- [ ] Compte Cloudflare créé
- [ ] Domaine ajouté à Cloudflare
- [ ] DNS changés vers Cloudflare
- [ ] WAF activé
- [ ] Règles de base configurées
- [ ] Rate limiting configuré
- [ ] SSL/TLS configuré (Full strict)
- [ ] HTTPS forcé
- [ ] Tests effectués

### AWS WAF

- [ ] CloudFront distribution créée
- [ ] Web ACL créé
- [ ] Règles AWS Managed activées
- [ ] Rate limiting configuré
- [ ] WAF associé à CloudFront
- [ ] Logs CloudWatch activés
- [ ] Tests effectués

---

## 🚀 Prochaines Étapes

Après avoir configuré le WAF :

1. **Monitorer les logs** pendant 1-2 semaines
2. **Ajuster les règles** selon les faux positifs
3. **Créer des alertes** pour les attaques importantes
4. **Documenter les exceptions** pour l'équipe

---

*Guide créé le 22 Novembre 2025*

