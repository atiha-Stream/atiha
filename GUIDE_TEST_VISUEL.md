# 🎨 Guide de Test Visuel - Affichage et Fonctionnement

**Date** : 2025-12-06  
**Objectif** : Vérifier visuellement l'affichage et le fonctionnement des pages d'abonnement

---

## ✅ Résultats des Tests Automatiques

**Taux de réussite** : 100% (8/8 tests)

### Tests Réussis ✅

1. ✅ Page /subscription - Accessible
2. ✅ Page Admin /admin/premium - Accessible
3. ✅ Page Admin Login - Accessible
4. ✅ Page Dashboard - Accessible
5. ✅ API Plans d'abonnement - 2 plans disponibles
6. ✅ API Liens de paiement - 2 liens disponibles
7. ✅ API Liens après paiement - 2 liens disponibles
8. ✅ Cohérence Plans ↔ Liens - Tous les plans ont leurs liens

---

## 📋 Checklist de Test Visuel

### 1. Page /subscription

**URL** : `http://localhost:3000/subscription`

#### Affichage

- [ ] La page se charge sans erreur
- [ ] Le header est visible avec le logo et le menu
- [ ] Le titre "Abonnement" ou similaire est visible
- [ ] Les deux plans (Individuel et Famille) sont affichés côte à côte
- [ ] Chaque plan affiche :
  - [ ] Le titre du plan
  - [ ] Le prix (ex: "9.99" ou "14.99")
  - [ ] La période (ex: "mois")
  - [ ] L'engagement (ex: "Sans engagement")
  - [ ] La description
  - [ ] La liste des fonctionnalités (avec puces ou icônes)
  - [ ] Le bouton "S'abonner" avec la bonne couleur
- [ ] Le footer est visible en bas de page
- [ ] Pas de débordement horizontal
- [ ] Les couleurs et styles sont cohérents

#### Fonctionnement

- [ ] Cliquer sur "S'abonner" pour le plan Individuel
  - [ ] Le modal de paiement s'ouvre
  - [ ] L'iframe de paiement se charge
  - [ ] L'URL dans l'iframe est correct
  - [ ] Le modal peut être fermé (bouton X ou clic extérieur)
- [ ] Cliquer sur "S'abonner" pour le plan Famille
  - [ ] Le modal de paiement s'ouvre
  - [ ] L'iframe de paiement se charge
  - [ ] L'URL dans l'iframe est correct
  - [ ] Le modal peut être fermé

#### Console du Navigateur (F12)

- [ ] Aucune erreur JavaScript (onglet Console)
- [ ] Les requêtes API sont visibles (onglet Network) :
  - [ ] `GET /api/subscription/plans` → Status 200
  - [ ] `GET /api/subscription/payment-links` → Status 200
- [ ] Les réponses contiennent les bonnes données
- [ ] Pas d'erreurs 404 ou 500

#### Responsive Design

- [ ] **Desktop (1920x1080)** : Plans côte à côte, layout correct
- [ ] **Tablet (768x1024)** : Plans empilés verticalement, layout adapté
- [ ] **Mobile (375x667)** : Plans empilés, boutons accessibles, texte lisible

---

### 2. Page Admin /admin/premium

**URL** : `http://localhost:3000/admin/premium`  
**Prérequis** : Connexion admin requise

#### Connexion Admin

1. Aller sur `http://localhost:3000/admin/login`
2. Entrer les identifiants admin
3. Vérifier la redirection vers `/admin/dashboard`

#### Affichage

- [ ] La page se charge sans erreur
- [ ] Le header admin est visible
- [ ] Le menu de navigation admin est visible
- [ ] Les sections suivantes sont visibles :
  - [ ] Section "Plans d'abonnement"
  - [ ] Section "Liens de paiement"
  - [ ] Section "Liens après paiement"
  - [ ] Section "Codes Premium" (si présente)
  - [ ] Section "Prix d'abonnement" (si présente)

#### Formulaire Plans d'Abonnement

- [ ] Le formulaire Plan Individuel est visible
- [ ] Les champs sont pré-remplis avec les données de la DB :
  - [ ] Titre
  - [ ] Prix
  - [ ] Période
  - [ ] Engagement
  - [ ] Description
  - [ ] Fonctionnalités (liste)
  - [ ] Texte du bouton
  - [ ] Couleur du bouton
- [ ] Le formulaire Plan Famille est visible
- [ ] Les champs sont pré-remplis avec les données de la DB
- [ ] Le bouton "Sauvegarder les plans" est visible et cliquable

#### Formulaire Liens de Paiement

- [ ] Le formulaire Lien Individuel est visible
- [ ] Les champs sont pré-remplis :
  - [ ] URL du lien
  - [ ] Toggle Actif/Inactif
- [ ] Le formulaire Lien Famille est visible
- [ ] Les champs sont pré-remplis
- [ ] Le bouton "Sauvegarder les liens de paiement" est visible

#### Formulaire Liens Après Paiement

- [ ] Le formulaire Lien Individuel est visible
- [ ] Les champs sont pré-remplis :
  - [ ] URL du lien
  - [ ] Toggle Actif/Inactif
- [ ] Le formulaire Lien Famille est visible
- [ ] Les champs sont pré-remplis
- [ ] Le bouton "Sauvegarder les liens après paiement" est visible

#### Fonctionnement

##### Test de Modification d'un Plan

1. Modifier le titre du plan Individuel (ex: "Plan Individuel Premium")
2. Modifier le prix (ex: "12.99")
3. Cliquer sur "Sauvegarder les plans"
4. Vérifier :
   - [ ] Un message de succès s'affiche
   - [ ] Un indicateur de chargement apparaît pendant la sauvegarde
   - [ ] La page se met à jour avec les nouvelles valeurs
5. Recharger la page (F5)
6. Vérifier :
   - [ ] Les modifications sont toujours présentes
   - [ ] Les données sont persistées dans la DB

##### Test de Modification d'un Lien

1. Modifier l'URL du lien de paiement Individuel
2. Activer/désactiver le toggle
3. Cliquer sur "Sauvegarder les liens de paiement"
4. Vérifier :
   - [ ] Un message de succès s'affiche
   - [ ] Les modifications sont persistées
5. Vérifier dans la page `/subscription` :
   - [ ] Le nouveau lien est utilisé
   - [ ] Le bouton "S'abonner" pointe vers le bon URL

##### Test des Toggles

- [ ] Cliquer sur le toggle du lien Individuel
  - [ ] L'état change visuellement
  - [ ] La sauvegarde automatique fonctionne (si implémenté)
- [ ] Répéter pour les autres toggles

#### Console du Navigateur (F12)

- [ ] Aucune erreur JavaScript (onglet Console)
- [ ] Les requêtes API sont visibles (onglet Network) :
  - [ ] `GET /api/subscription/plans` → Status 200
  - [ ] `GET /api/subscription/payment-links` → Status 200
  - [ ] `GET /api/subscription/post-payment-links` → Status 200
  - [ ] `POST /api/subscription/plans` → Status 200 (après sauvegarde)
  - [ ] `POST /api/subscription/payment-links` → Status 200 (après sauvegarde)
  - [ ] `POST /api/subscription/post-payment-links` → Status 200 (après sauvegarde)
- [ ] Les réponses contiennent les bonnes données
- [ ] Les requêtes POST contiennent les bonnes données dans le body

#### Responsive Design

- [ ] **Desktop (1920x1080)** : Tous les formulaires visibles, layout correct
- [ ] **Tablet (768x1024)** : Formulaires empilés si nécessaire, layout adapté
- [ ] **Mobile (375x667)** : Formulaires utilisables, boutons accessibles

---

### 3. Vérification de la Cohérence

#### Test de Synchronisation

1. Modifier un plan dans `/admin/premium`
2. Aller sur `/subscription`
3. Vérifier :
   - [ ] Les modifications sont visibles
   - [ ] Les prix sont à jour
   - [ ] Les fonctionnalités sont à jour
   - [ ] Les boutons pointent vers les bons liens

#### Test de Persistance

1. Modifier des données dans `/admin/premium`
2. Sauvegarder
3. Fermer le navigateur
4. Rouvrir le navigateur
5. Aller sur `/admin/premium`
6. Vérifier :
   - [ ] Les modifications sont toujours présentes
   - [ ] Les données sont persistées dans la DB

---

## 🐛 Problèmes Courants à Vérifier

### Problèmes d'Affichage

- [ ] **Plans non affichés** : Vérifier la console pour les erreurs API
- [ ] **Données manquantes** : Vérifier que la DB contient les données
- [ ] **Styles cassés** : Vérifier que les CSS sont chargés
- [ ] **Débordement horizontal** : Vérifier le responsive design

### Problèmes de Fonctionnement

- [ ] **Boutons non cliquables** : Vérifier les erreurs JavaScript
- [ ] **Modals ne s'ouvrent pas** : Vérifier les événements onClick
- [ ] **Sauvegarde échoue** : Vérifier les erreurs API dans la console
- [ ] **Données non persistées** : Vérifier la connexion DB

---

## 📊 Checklist de Validation Finale

### Fonctionnalités Critiques

- [ ] Les plans s'affichent correctement sur `/subscription`
- [ ] Les liens de paiement fonctionnent
- [ ] Les modals de paiement s'ouvrent
- [ ] Les modifications dans `/admin/premium` sont sauvegardées
- [ ] Les modifications sont visibles sur `/subscription`
- [ ] Les données sont persistées dans la DB
- [ ] Le fallback localStorage fonctionne en cas d'erreur

### Qualité

- [ ] Aucune erreur dans la console
- [ ] Toutes les requêtes API réussissent
- [ ] Le responsive design fonctionne
- [ ] Les interactions sont fluides
- [ ] Les messages de feedback sont clairs

---

## 🚀 Commandes Utiles

### Lancer les Tests Automatiques

```bash
npm run test:display
```

### Vérifier les Pages

```bash
npm run verify:subscription
npm run verify:admin:premium
```

### Tester les API

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

