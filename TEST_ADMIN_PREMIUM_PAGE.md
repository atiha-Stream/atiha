# 🧪 Guide de Test - Page Admin /admin/premium

**Date** : 2025-12-06  
**Page** : `/admin/premium`  
**Objectif** : Vérifier la gestion des plans d'abonnement et des liens de paiement via l'interface admin

---

## 📋 Prérequis

- [ ] Serveur de développement lancé : `npm run dev`
- [ ] Application accessible : `http://localhost:3000`
- [ ] Base de données PostgreSQL connectée
- [ ] Compte admin créé et accessible
- [ ] Identifiants admin disponibles

---

## 🔐 Étape 1 : Connexion Admin

**URL** : `http://localhost:3000/admin/login`

### Identifiants par défaut (si configurés) :
- **Username** : `leGenny` (ou celui configuré)
- **Password** : `Atiasekbaby@89#2025!` (ou celui configuré)
- **Security Code** : `101089555@ABC` (si requis)

### Tests à effectuer :

- [ ] La page de connexion s'affiche correctement
- [ ] Les champs username et password sont visibles
- [ ] La connexion avec des identifiants valides fonctionne
- [ ] Redirection vers `/admin/dashboard` après connexion réussie
- [ ] Message d'erreur si identifiants invalides

---

## ✅ Checklist de Test - Page /admin/premium

### 1. Accès à la Page

**URL** : `http://localhost:3000/admin/premium`

- [ ] La page se charge sans erreur
- [ ] Pas d'erreurs dans la console du navigateur (F12)
- [ ] Le header admin est visible
- [ ] Le menu de navigation admin est visible
- [ ] Les sections de gestion sont visibles :
  - [ ] Section "Plans d'abonnement"
  - [ ] Section "Liens de paiement"
  - [ ] Section "Liens après paiement"
  - [ ] Section "Codes Premium" (si présente)
  - [ ] Section "Prix d'abonnement" (si présente)

### 2. Chargement des Plans depuis la DB

**Vérifications** :

- [ ] Les plans d'abonnement s'affichent dans le formulaire
- [ ] Les champs sont pré-remplis avec les données de la DB :
  - [ ] Plan Individuel : titre, prix, période, engagement, description, fonctionnalités
  - [ ] Plan Famille : titre, prix, période, engagement, description, fonctionnalités
- [ ] Les boutons de sauvegarde sont visibles

**Comment vérifier** :
1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Network"
3. Recharger la page
4. Vérifier qu'une requête vers `/api/subscription/plans` est effectuée
5. Vérifier que la réponse contient les plans

### 3. Modification des Plans

**Scénarios à tester** :

#### 3.1 Modifier le Plan Individuel
- [ ] Modifier le titre du plan
- [ ] Modifier le prix
- [ ] Modifier la période
- [ ] Modifier l'engagement
- [ ] Modifier la description
- [ ] Ajouter/retirer des fonctionnalités
- [ ] Modifier le texte du bouton
- [ ] Modifier la couleur du bouton
- [ ] Cliquer sur "Sauvegarder les plans"
- [ ] Vérifier que la sauvegarde réussit (message de succès)
- [ ] Vérifier que les modifications sont persistées dans la DB

#### 3.2 Modifier le Plan Famille
- [ ] Répéter les mêmes tests que pour le plan individuel
- [ ] Vérifier que les deux plans peuvent être modifiés indépendamment

**Vérifications après sauvegarde** :
1. Recharger la page
2. Vérifier que les modifications sont toujours présentes
3. Vérifier dans la page `/subscription` que les modifications sont visibles

### 4. Chargement des Liens de Paiement

**Vérifications** :

- [ ] Les liens de paiement s'affichent dans le formulaire
- [ ] Les champs sont pré-remplis avec les données de la DB :
  - [ ] Lien Individuel : URL et état actif/inactif
  - [ ] Lien Famille : URL et état actif/inactif
- [ ] Les boutons de sauvegarde sont visibles

**Comment vérifier** :
1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Network"
3. Recharger la page
4. Vérifier qu'une requête vers `/api/subscription/payment-links` est effectuée
5. Vérifier que la réponse contient les liens

### 5. Modification des Liens de Paiement

**Scénarios à tester** :

#### 5.1 Modifier le Lien Individuel
- [ ] Modifier l'URL du lien
- [ ] Activer/désactiver le lien
- [ ] Cliquer sur "Sauvegarder les liens de paiement"
- [ ] Vérifier que la sauvegarde réussit
- [ ] Vérifier que les modifications sont persistées dans la DB

#### 5.2 Modifier le Lien Famille
- [ ] Répéter les mêmes tests que pour le lien individuel
- [ ] Vérifier que les deux liens peuvent être modifiés indépendamment

**Vérifications après sauvegarde** :
1. Recharger la page
2. Vérifier que les modifications sont toujours présentes
3. Vérifier dans la page `/subscription` que les nouveaux liens sont utilisés

### 6. Chargement des Liens Après Paiement

**Vérifications** :

- [ ] Les liens après paiement s'affichent dans le formulaire
- [ ] Les champs sont pré-remplis avec les données de la DB :
  - [ ] Lien Individuel : URL et état actif/inactif
  - [ ] Lien Famille : URL et état actif/inactif
- [ ] Les boutons de sauvegarde sont visibles

### 7. Modification des Liens Après Paiement

**Scénarios à tester** :

#### 7.1 Modifier le Lien Individuel
- [ ] Modifier l'URL du lien
- [ ] Activer/désactiver le lien
- [ ] Cliquer sur "Sauvegarder les liens après paiement"
- [ ] Vérifier que la sauvegarde réussit
- [ ] Vérifier que les modifications sont persistées dans la DB

#### 7.2 Modifier le Lien Famille
- [ ] Répéter les mêmes tests que pour le lien individuel

### 8. Fonctionnalités de Toggle (Activer/Désactiver)

**Tests à effectuer** :

- [ ] Toggle du lien de paiement individuel
  - [ ] Cliquer sur le toggle
  - [ ] Vérifier que l'état change visuellement
  - [ ] Vérifier que la sauvegarde automatique fonctionne (si implémenté)
  - [ ] Vérifier dans la DB que l'état est mis à jour

- [ ] Toggle du lien de paiement famille
  - [ ] Répéter les mêmes tests

- [ ] Toggle du lien après paiement individuel
  - [ ] Répéter les mêmes tests

- [ ] Toggle du lien après paiement famille
  - [ ] Répéter les mêmes tests

### 9. Fallback vers localStorage/SecureStorage

**Scénario de test** :

1. **Désactiver temporairement la connexion DB** (ou simuler une erreur)
2. **Vérifier** :
   - [ ] La page charge toujours
   - [ ] Les données depuis localStorage/SecureStorage s'affichent si disponibles
   - [ ] Pas d'erreur bloquante dans la console
   - [ ] Les modifications sont sauvegardées dans localStorage/SecureStorage

### 10. Validation des Formulaires

**Tests à effectuer** :

- [ ] Validation du formulaire de plans
  - [ ] Message d'erreur si titre vide
  - [ ] Message d'erreur si prix vide
  - [ ] Message d'erreur si période vide
  - [ ] Message d'erreur si engagement vide

- [ ] Validation du formulaire de liens
  - [ ] Message d'erreur si URL vide
  - [ ] Message d'erreur si URL invalide (format)

### 11. Messages de Feedback

**Vérifications** :

- [ ] Message de succès après sauvegarde des plans
- [ ] Message de succès après sauvegarde des liens de paiement
- [ ] Message de succès après sauvegarde des liens après paiement
- [ ] Message d'erreur en cas d'échec de sauvegarde
- [ ] Indicateur de chargement pendant les opérations

### 12. Responsive Design

**Tests sur différentes tailles d'écran** :

- [ ] **Desktop (1920x1080)** : Layout correct, tous les formulaires visibles
- [ ] **Tablet (768x1024)** : Layout adapté, formulaires empilés si nécessaire
- [ ] **Mobile (375x667)** : Layout mobile optimisé, formulaires utilisables

---

## 🔍 Vérifications Techniques

### Console du Navigateur

Ouvrir la console (F12) et vérifier :

- [ ] Aucune erreur JavaScript
- [ ] Les requêtes API sont effectuées :
  - [ ] `GET /api/subscription/plans` → Status 200
  - [ ] `GET /api/subscription/payment-links` → Status 200
  - [ ] `GET /api/subscription/post-payment-links` → Status 200
  - [ ] `POST /api/subscription/plans` → Status 200 (après sauvegarde)
  - [ ] `POST /api/subscription/payment-links` → Status 200 (après sauvegarde)
  - [ ] `POST /api/subscription/post-payment-links` → Status 200 (après sauvegarde)
- [ ] Les données sont bien reçues et envoyées

### Network Tab

Dans l'onglet Network (F12 → Network) :

- [ ] Les requêtes vers les API sont visibles
- [ ] Les réponses contiennent les bonnes données
- [ ] Pas d'erreurs 404 ou 500
- [ ] Les requêtes POST contiennent les bonnes données dans le body

### État de Chargement

- [ ] Un indicateur de chargement s'affiche pendant le chargement des données
- [ ] L'indicateur disparaît une fois les données chargées
- [ ] Un indicateur de chargement s'affiche pendant la sauvegarde
- [ ] L'indicateur disparaît une fois la sauvegarde terminée

---

## 🐛 Scénarios d'Erreur à Tester

### 1. Base de Données Indisponible

**Test** :
- Simuler une erreur de connexion DB
- **Vérifier** : Le fallback vers localStorage/SecureStorage fonctionne

### 2. Aucune Donnée dans la DB

**Test** :
- Supprimer toutes les données de la DB
- **Vérifier** : Les formulaires sont vides mais utilisables, possibilité de créer de nouvelles données

### 3. Erreur lors de la Sauvegarde

**Test** :
- Simuler une erreur lors de la sauvegarde (ex: DB indisponible)
- **Vérifier** : Un message d'erreur approprié s'affiche, les données ne sont pas perdues

### 4. Données Invalides

**Test** :
- Essayer de sauvegarder des données invalides (URL vide, prix invalide, etc.)
- **Vérifier** : Messages de validation appropriés, sauvegarde bloquée

---

## 📊 Résultats Attendus

### Succès ✅

- Page se charge correctement
- Plans et liens chargés depuis la DB
- Modifications sauvegardées avec succès
- Données persistées dans la DB
- Fallback localStorage/SecureStorage opérationnel
- Messages de feedback appropriés

### Échecs ❌

- Erreurs dans la console
- Données non chargées
- Sauvegarde échouée
- Pas de fallback en cas d'erreur
- Validation des formulaires non fonctionnelle

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

### Vérifier la Page Admin

```bash
npm run verify:admin:premium
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

