# 🧪 COMMENT FAIRE LES TESTS - GUIDE PRATIQUE

## 🚀 ÉTAPE 1 : LANCER L'APPLICATION

### 1.1 Ouvrir un terminal
```bash
# Aller dans le dossier du projet (si pas déjà dedans)
cd C:\Users\Shadow\Downloads\atiha\Atiha
```

### 1.2 Lancer le serveur de développement
```bash
npm run dev
```

Vous devriez voir :
```
> atiha@1.0.0 dev
> next dev

  ▲ Next.js 15.5.3
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

### 1.3 Ouvrir l'application dans le navigateur
- Ouvrez votre navigateur (Chrome, Firefox, Edge)
- Allez à : `http://localhost:3000`

---

## 📋 ÉTAPE 2 : PRÉPARER LES OUTILS

### 2.1 Ouvrir le guide de test
- Ouvrez le fichier `TESTING_MANUAL.md` dans votre éditeur
- Ou imprimez-le / gardez-le ouvert à côté

### 2.2 Préparer vos identifiants
**Pour tester l'utilisateur** :
- Si vous avez déjà un compte → utilisez-le
- Sinon → créez-en un via `/register`

**Pour tester l'admin** :
- Username : `leGenny` (ou celui configuré)
- Password : `Atiasekbaby@89#2025!` (ou celui configuré)
- Security Code : `101089555@ABC` (ou celui configuré)

---

## ✅ ÉTAPE 3 : COMMENCER LES TESTS

### 📍 Ordre recommandé pour tester :

---

## 🔐 TEST 1 : AUTHENTIFICATION (PRIORITÉ #1)

### Test 1.1 : Inscription utilisateur

1. **Allez sur la page d'inscription** :
   - Cliquez sur "S'inscrire" dans le menu
   - Ou allez directement à : `http://localhost:3000/register`

2. **Testez avec des données valides** :
   ```
   Nom : Test User
   Email : test@example.com
   Mot de passe : TestPassword123@
   Confirmer mot de passe : TestPassword123@
   ```

3. **Vérifiez** :
   - [ ] Le formulaire s'affiche correctement
   - [ ] Vous pouvez remplir tous les champs
   - [ ] Le bouton "S'inscrire" est cliquable
   - [ ] Après soumission → message de succès
   - [ ] Redirection vers une page (dashboard ou home)

4. **Testez les erreurs** :
   - [ ] Email invalide (ex: `test@`) → message d'erreur
   - [ ] MDP trop court (ex: `123`) → message d'erreur
   - [ ] MDP non correspondant → message d'erreur

5. **Cochez dans TESTING_MANUAL.md** :
   - Section 1.1 - Inscription
   - Cochez les cases réussies
   - Notez les problèmes

**Temps estimé** : 5-10 minutes

---

### Test 1.2 : Connexion utilisateur

1. **Allez sur la page de connexion** :
   - Cliquez sur "Connexion" dans le menu
   - Ou : `http://localhost:3000/login`

2. **Connectez-vous avec votre compte** :
   ```
   Email : test@example.com
   Mot de passe : TestPassword123@
   ```

3. **Vérifiez** :
   - [ ] Connexion réussie
   - [ ] Redirection vers dashboard ou home
   - [ ] Menu affiche votre nom / "Profil" / "Déconnexion"

4. **Testez les erreurs** :
   - [ ] Email incorrect → message d'erreur
   - [ ] MDP incorrect → message d'erreur
   - [ ] 5 tentatives échouées → verrouillage temporaire

5. **Cochez dans TESTING_MANUAL.md** :
   - Section 1.2 - Connexion

**Temps estimé** : 5 minutes

---

## 🎬 TEST 2 : NAVIGATION ET CONTENU (PRIORITÉ #2)

### Test 2.1 : Page d'accueil

1. **Allez sur la page d'accueil** :
   - `http://localhost:3000`

2. **Vérifiez** :
   - [ ] Page se charge rapidement (< 3 secondes)
   - [ ] Menu de navigation visible
   - [ ] Sections de contenu affichées (Films, Séries, etc.)
   - [ ] Images se chargent
   - [ ] Tous les liens du menu fonctionnent

3. **Testez chaque lien du menu** :
   - [ ] Films → `/films`
   - [ ] Séries → `/series`
   - [ ] Animes → `/animes`
   - [ ] Recherche → fonctionne
   - [ ] Profile (si connecté) → `/profile`

4. **Cochez dans TESTING_MANUAL.md** :
   - Section 2.1 - Page d'accueil
   - Section 2.2 - Menu de navigation

**Temps estimé** : 5-10 minutes

---

### Test 2.2 : Liste des contenus

1. **Allez sur une page de contenu** :
   - Exemple : `http://localhost:3000/films`

2. **Vérifiez** :
   - [ ] Liste de contenus affichée
   - [ ] Images d'affiche visibles
   - [ ] Informations visibles (titre, année)
   - [ ] Cliquer sur un contenu → ouvre la page détail

3. **Testez les filtres (si disponibles)** :
   - [ ] Filtre par genre fonctionne
   - [ ] Filtre par année fonctionne
   - [ ] Tri fonctionne

4. **Cochez dans TESTING_MANUAL.md** :
   - Section 3.1 - Liste des contenus

**Temps estimé** : 5 minutes

---

## ▶️ TEST 3 : LECTEUR VIDÉO (PRIORITÉ #3 - FONCTIONNALITÉ PRINCIPALE)

### Test 3.1 : Regarder une vidéo

1. **Trouvez un contenu avec vidéo** :
   - Cliquez sur un film/série
   - Ou créez-en un via admin (voir Test 6)

2. **Cliquez sur "Regarder"** :
   - Vous devriez être redirigé vers `/watch/[id]`

3. **Testez le lecteur** :
   - [ ] Vidéo se charge
   - [ ] Contrôles fonctionnent (play, pause, volume)
   - [ ] Barre de progression fonctionne
   - [ ] Plein écran fonctionne (bouton ou F11)
   - [ ] Volume ajustable
   - [ ] Pas d'erreurs dans la console (F12)

4. **Testez différents formats** :
   - [ ] Vidéo MP4 direct
   - [ ] Vidéo HLS (.m3u8)
   - [ ] Vidéo iframe (supervideo.cc, dsvplay.com, etc.)
   - [ ] YouTube (si vous en avez)

5. **Testez le plein écran (important - bug récemment corrigé)** :
   - [ ] Pour iframe : bouton plein écran fonctionne
   - [ ] Pour vidéo directe : plein écran fonctionne
   - [ ] Sortir du plein écran fonctionne (ESC)

6. **Cochez dans TESTING_MANUAL.md** :
   - Section 4.1 - Chargement du lecteur
   - Section 4.2 - Formats spécifiques

**Temps estimé** : 10-15 minutes

---

## 👨‍💼 TEST 4 : PANEL ADMIN (PRIORITÉ #4)

### Test 4.1 : Connexion admin

1. **Allez sur la page admin** :
   - `http://localhost:3000/admin/login`

2. **Connectez-vous** :
   ```
   Username : leGenny
   Password : Atiasekbaby@89#2025!
   Security Code : 101089555@ABC
   ```

3. **Vérifiez** :
   - [ ] Connexion réussie
   - [ ] Redirection vers `/admin/dashboard`

4. **Cochez dans TESTING_MANUAL.md** :
   - Section 6.1 - Connexion admin

**Temps estimé** : 3 minutes

---

### Test 4.2 : Ajouter du contenu (IMPORTANT)

1. **Allez sur "Ajouter du contenu"** :
   - Menu admin → "Ajouter du contenu"
   - Ou : `http://localhost:3000/admin/add-content`

2. **Remplissez le formulaire** :
   ```
   Titre : Film de Test
   Description : Ceci est un film de test pour vérifier le système
   Année : 2024
   Type : Film OMDB
   Genre : Action, Aventure (sélectionnez plusieurs)
   URL de l'affiche : https://media.themoviedb.org/t/p/w220_and_h330_face/w7umt2RoltHeNU8JKlbW5VkceL8.jpg
   URL vidéo : https://supervideo.cc/e/ps2is9swkcfu
   ```

3. **Vérifiez** :
   - [ ] Tous les champs sont remplissables
   - [ ] Validation des champs requis
   - [ ] L'image d'affiche se prévisualise (si URL fournie)
   - [ ] Soumission réussie
   - [ ] Message de succès affiché
   - [ ] Le contenu apparaît dans la liste

4. **Testez différents formats vidéo** :
   - [ ] Format iframe : `https://supervideo.cc/e/...`
   - [ ] Format HLS : `https://example.com/video.m3u8`
   - [ ] Format MP4 : `https://example.com/video.mp4`

5. **Cochez dans TESTING_MANUAL.md** :
   - Section 6.4 - Ajout de contenu

**Temps estimé** : 10-15 minutes

---

### Test 4.3 : Dashboard admin

1. **Allez sur le dashboard** :
   - `http://localhost:3000/admin/dashboard`

2. **Vérifiez** :
   - [ ] Statistiques affichées (utilisateurs, contenus)
   - [ ] Graphiques/visualisations (si présents)
   - [ ] Navigation vers autres sections fonctionne

3. **Testez les autres sections admin** :
   - [ ] Utilisateurs : `/admin/users`
   - [ ] Sécurité : `/admin/security`
   - [ ] Analytics : `/admin/analytics`

4. **Cochez dans TESTING_MANUAL.md** :
   - Section 6.2 - Dashboard admin

**Temps estimé** : 5-10 minutes

---

## 📱 TEST 5 : RESPONSIVE (PRIORITÉ #5)

### Test 5.1 : Tester sur différentes tailles

1. **Ouvrez les outils de développement** :
   - Appuyez sur `F12` dans votre navigateur
   - Ou clic droit → "Inspecter"

2. **Activez le mode responsive** :
   - Cliquez sur l'ic отличает "Toggle device toolbar" (ou `Ctrl+Shift+M`)
   - Ou menu → More tools → Toggle device toolbar

3. **Testez différentes tailles** :
   - [ ] **Desktop** : 1920x1080 → Layout complet
   - [ ] **Tablet** : iPad (768x1024) → Menu adapté
   - [ ] **Mobile** : iPhone (375x667) → Menu hamburger

4. **Vérifiez pour chaque taille** :
   - [ ] Menu fonctionne
   - [ ] Contenus affichés correctement
   - [ ] Pas de débordement horizontal
   - [ ] Boutons accessibles
   - [ ] Lecteur vidéo adapté

5. **Cochez dans TESTING_MANUAL.md** :
   - Section 7 - Responsive Design

**Temps estimé** : 10-15 minutes

---

## ⭐ TEST 6 : FONCTIONNALITÉS UTILISATEUR

### Test 6.1 : Favoris

1. **Connectez-vous en tant qu'utilisateur** :
   - Allez sur `/login`

2. **Ajoutez un contenu aux favoris** :
   - Ouvrez un contenu
   - Cliquez sur "❤️ Ajouter aux favoris" ou bouton similaire

3. **Vérifiez** :
   - [ ] Le contenu est ajouté
   - [ ] Vous pouvez voir vos favoris (`/collection` ou `/profile`)
   - [ ] Vous pouvez retirer des favoris
   - [ ] Les favoris persistent après déconnexion/reconnexion

4. **Cochez dans TESTING_MANUAL.md** :
   - Section 5.1 - Favoris

**Temps estimé** : 5 minutes

---

### Test 6.2 : Profil utilisateur

1. **Allez sur votre profil** :
   - Cliquez sur "Profil" dans le menu
   - Ou : `http://localhost:3000/profile`

2. **Vérifiez** :
   - [ ] Informations affichées
   - [ ] Vous pouvez modifier votre nom
   - [ ] Vous pouvez modifier votre email
   - [ ] Vous pouvez changer votre mot de passe
   - [ ] Modifications sauvegardées

3. **Cochez dans TESTING_MANUAL.md** :
   - Section 5.3 - Profil utilisateur

**Temps estimé** : 5 minutes

---

## 🔒 TEST 7 : SÉCURITÉ (PRIORITÉ #6)

### Test 7.1 : Vérifier les headers de sécurité

1. **Ouvrez les outils de développement** :
   - `F12` → Onglet "Network"

2. **Rechargez une page** :
   - Rechargez `http://localhost:3000`

3. **Vérifiez les headers** :
   - Cliquez sur la requête principale
   - Onglet "Headers" → "Response Headers"
   - [ ] En production : `Strict-Transport-Security` présent
   - [ ] `X-Content-Type-Options: nosniff` présent
   - [ ] `X-Frame-Options: DENY` présent

**Note** : Les headers de sécurité sont activés seulement en production (`NODE_ENV=production`)

4. **Cochez dans TESTING_MANUAL.md** :
   - Section 8.1 - Sécurité

**Temps estimé** : 3 minutes

---

### Test 7.2 : Rate limiting

1. **Testez le rate limiting sur login admin** :
   - Allez sur `/admin/login`
   - Essayez de vous connecter avec un mauvais mot de passe **6 fois**

2. **Vérifiez** :
   - [ ] Après 5 tentatives → message "Trop de tentatives"
   - [ ] Verrouillage temporaire (1 minute par défaut)
   - [ ] Impossible de réessayer immédiatement

3. **Cochez dans TESTING_MANUAL.md** :
   - Section 6.1 - Connexion admin (rate limiting)

**Temps estimé** : 2 minutes

---

## 🐛 TEST 8 : GESTION DES ERREURS

### Test 8.1 : Pages d'erreur

1. **Testez la page 404** :
   - Allez sur : `http://localhost:3000Measuring-page-inexistante`

2. **Vérifiez** :
   - [ ] Page 404 s'affiche
   - [ ] Message clair "Page non trouvée"
   - [ ] Lien pour retourner à l'accueil

3. **Testez une erreur vidéo** :
   - Essayez de lire une vidéo avec une URL invalide
   - [ ] Message d'erreur approprié affiché

4. **Cochez dans TESTING_MANUAL.md** :
   - Section 10.1 - Gestion des erreurs

**Temps estimé** : 5 minutes

---

## 📊 RÉSUMÉ ET RAPPORT

### Après avoir testé :

1. **Ouvrez TESTING_MANUAL.md**

2. **Remplissez le résumé** :
   - Comptez les tests réussis
   - Comptez les tests échoués
   - Calculez le pourcentage

3. **Notez les problèmes** :
   - Section "Problèmes détectés"
   - Critiques (bloquants)
   - Importants (à corriger)
   - Mineurs (améliorations)

4. **Validez** :
   - Tous les tests critiques passent ?
   - Aucun problème bloquant ?

---

## ⏱️ TEMPS TOTAL ESTIMÉ

| Section | Temps |
|---------|-------|
| Authentification | 15-20 min |
| Navigation | 10-15 min |
| Lecteur vidéo | 10-15 min |
| Panel admin | 20-30 min |
| Responsive | 10-15 min |
| Fonctionnalités user | 10 min |
| Sécurité | 5 min |
| Erreurs | 5 min |
| **TOTAL** | **~90-120 minutes** |

---

## 💡 CONSEILS

1. **Testez dans l'ordre** : Les tests sont ordonnés par priorité
2. **Prenez des notes** : Notez tout ce qui semble anormal
3. **Faites des captures d'écran** : Pour documenter les bugs
4. **Testez sur plusieurs navigateurs** : Chrome, Firefox, Edge
5. **Ne vous précipitez pas** : Prenez votre temps pour chaque test

---

## 🆘 EN CAS DE PROBLÈME

### L'application ne démarre pas ?
```bash
# Vérifiez que vous êtes dans le bon dossier
cd C:\Users\Shadow\Downloads\atiha\Atiha

# Réinstallez les dépendances si nécessaire
npm install

# Relancez
npm run dev
```

### Page blanche / Erreur ?
- Ouvrez la console (F12) → onglet "Console"
- Regardez les erreurs
- Notez-les dans TESTING_MANUAL.md

### Questions ?
- Consultez TESTING_MANUAL.md pour plus de détails
- Vérifiez la console du navigateur (F12)
- Vérifiez les logs du serveur (terminal)

---

**Bonne chance avec vos tests ! 🚀**

