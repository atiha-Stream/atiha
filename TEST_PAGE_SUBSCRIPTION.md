# 🧪 Guide de Test - Page /subscription

**Date** : 2025-12-06  
**Page** : `/subscription`  
**Objectif** : Vérifier le chargement des données depuis PostgreSQL et le fonctionnement de la page

---

## 📋 Prérequis

- [ ] Serveur de développement lancé : `npm run dev`
- [ ] Application accessible : `http://localhost:3000`
- [ ] Base de données PostgreSQL connectée
- [ ] Au moins un plan d'abonnement créé dans la DB (via `/admin/premium`)
- [ ] Compte utilisateur pour tester

---

## ✅ Checklist de Test

### 1. Chargement de la Page

**URL** : `http://localhost:3000/subscription`

- [ ] La page se charge sans erreur
- [ ] Pas d'erreurs dans la console du navigateur (F12)
- [ ] Le header et le footer sont visibles
- [ ] Le titre "Abonnement" ou similaire est visible

### 2. Chargement des Plans depuis la DB

**Vérifications** :

- [ ] Les plans d'abonnement s'affichent (individuel et/ou famille)
- [ ] Les informations des plans sont correctes :
  - [ ] Titre du plan
  - [ ] Prix
  - [ ] Période (mois/année)
  - [ ] Engagement
  - [ ] Liste des fonctionnalités
  - [ ] Bouton d'abonnement

**Comment vérifier** :
1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Network"
3. Recharger la page
4. Vérifier qu'une requête vers `/api/subscription/plans` est effectuée
5. Vérifier que la réponse contient les plans

### 3. Chargement des Liens de Paiement

**Vérifications** :

- [ ] Les liens de paiement sont chargés depuis la DB
- [ ] Les boutons "S'abonner" pointent vers les bons liens

**Comment vérifier** :
1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Network"
3. Recharger la page
4. Vérifier qu'une requête vers `/api/subscription/payment-links` est effectuée
5. Vérifier que la réponse contient les liens

### 4. Affichage des Plans

**Scénarios à tester** :

#### 4.1 Plans Disponibles
- [ ] Si des plans existent dans la DB, ils s'affichent correctement
- [ ] Les plans inactifs ne s'affichent pas
- [ ] Les deux plans (individuel et famille) s'affichent si disponibles

#### 4.2 Aucun Plan Disponible
- [ ] Si aucun plan dans la DB, le fallback vers localStorage fonctionne
- [ ] Un message approprié s'affiche si aucun plan n'est disponible

### 5. Interactions avec les Boutons

**Tests à effectuer** :

- [ ] Cliquer sur "S'abonner" pour le plan individuel
  - [ ] Le modal de paiement s'ouvre
  - [ ] L'iframe de paiement se charge avec le bon URL
  - [ ] Le modal se ferme correctement

- [ ] Cliquer sur "S'abonner" pour le plan famille
  - [ ] Le modal de paiement s'ouvre
  - [ ] L'iframe de paiement se charge avec le bon URL
  - [ ] Le modal se ferme correctement

### 6. Fallback vers localStorage

**Scénario de test** :

1. **Désactiver temporairement la connexion DB** (ou simuler une erreur)
2. **Vérifier** :
   - [ ] La page charge toujours
   - [ ] Les plans depuis localStorage s'affichent si disponibles
   - [ ] Pas d'erreur bloquante dans la console

### 7. Codes Premium

**Vérifications** :

- [ ] Le champ de code premium est visible
- [ ] La saisie d'un code fonctionne
- [ ] L'activation d'un code fonctionne
- [ ] Les messages de succès/erreur s'affichent correctement

### 8. Responsive Design

**Tests sur différentes tailles d'écran** :

- [ ] **Desktop (1920x1080)** : Layout correct
- [ ] **Tablet (768x1024)** : Layout adapté
- [ ] **Mobile (375x667)** : Layout mobile optimisé

---

## 🔍 Vérifications Techniques

### Console du Navigateur

Ouvrir la console (F12) et vérifier :

- [ ] Aucune erreur JavaScript
- [ ] Les requêtes API sont effectuées :
  - [ ] `GET /api/subscription/plans` → Status 200
  - [ ] `GET /api/subscription/payment-links` → Status 200
- [ ] Les données sont bien reçues

### Network Tab

Dans l'onglet Network (F12 → Network) :

- [ ] Les requêtes vers les API sont visibles
- [ ] Les réponses contiennent les bonnes données
- [ ] Pas d'erreurs 404 ou 500

### État de Chargement

- [ ] Un indicateur de chargement s'affiche pendant le chargement des plans
- [ ] L'indicateur disparaît une fois les données chargées

---

## 🐛 Scénarios d'Erreur à Tester

### 1. Base de Données Indisponible

**Test** :
- Simuler une erreur de connexion DB
- **Vérifier** : Le fallback vers localStorage fonctionne

### 2. Aucun Plan dans la DB

**Test** :
- Supprimer tous les plans de la DB
- **Vérifier** : Un message approprié s'affiche ou le fallback fonctionne

### 3. Lien de Paiement Invalide

**Test** :
- Configurer un lien de paiement invalide
- **Vérifier** : Un message d'erreur approprié s'affiche

---

## 📊 Résultats Attendus

### Succès ✅

- Page se charge correctement
- Plans affichés depuis la DB
- Liens de paiement fonctionnels
- Interactions fluides
- Fallback localStorage opérationnel

### Échecs ❌

- Erreurs dans la console
- Plans non chargés
- Boutons non fonctionnels
- Pas de fallback en cas d'erreur

---

## 🚀 Commandes Utiles

### Vérifier les Plans dans la DB

```bash
npx tsx scripts/test-db-connection.ts
```

### Tester les Routes API

```bash
npm run test:api:subscription
```

### Ouvrir Prisma Studio

```bash
npm run db:studio
```

---

## 📝 Notes de Test

**Date du test** : _______________  
**Testeur** : _______________  
**Navigateur** : _______________  
**Version** : _______________  

**Résultats** :
- [ ] Tous les tests passent
- [ ] Problèmes identifiés : _______________
- [ ] Commentaires : _______________

---

**Guide créé le 06/12/2025**

