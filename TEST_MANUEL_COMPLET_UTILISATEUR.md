# 🧪 TEST MANUEL COMPLET - FONCTIONNALITÉS UTILISATEUR

**Date** : 31/10/2025  
**Version** : 1.0.0  
**Environnement de test** : Développement / Production

---

## 📋 PRÉPARATION DES TESTS

### Prérequis
- [ ] Serveur lancé : `npm run dev`
- [ ] Application accessible : `http://localhost:3000`
- [ ] Navigateurs disponibles :
  - [ ] Chrome (Desktop)
  - [ ] Firefox (Desktop)
  - [ ] Safari/Chrome (Mobile)
- [ ] Données de test :
  - [ ] Au moins 5 films ajoutés
  - [ ] Au moins 3 séries avec épisodes
  - [ ] Contenu varié (genres, années)

### Comptes de Test
- [ ] **Utilisateur Standard** : `user@test.com` / `Password123!`
- [ ] **Utilisateur Premium** : `premium@test.com` / `Password123!`
- [ ] **Nouveau Compte** : À créer pendant les tests

---

## 🎯 CHECKLIST GLOBALE

**Total de tests** : ~150+  
**Temps estimé** : 2-3 heures

---

## 1. 🔐 AUTHENTIFICATION

### 1.1 Page d'Accueil Non Connecté

**URL** : `http://localhost:3000`

**Tests à effectuer** :
- [ ] **Affichage de la page d'accueil**
  - Page se charge correctement (< 3 secondes)
  - Header visible avec logo Atiha
  - Menu de navigation visible
  - Boutons "Connexion" et "Inscription" visibles
  - Footer présent en bas de page

- [ ] **Section Hero / Slider principal**
  - Carrousel de contenu en vedette visible
  - Navigation du carrousel fonctionne (flèches gauche/droite)
  - Bouton "Regarder" fonctionne
  - Bouton "En savoir plus" fonctionne
  - Auto-play du carrousel (si configuré)

- [ ] **Sections de contenu**
  - Section "Tendances" visible
  - Section "Films" visible
  - Section "Séries" visible
  - Section "Animes" visible (si contenu)
  - Section "Documentaires" visible (si contenu)
  - Section "Sports" visible (si contenu)
  - Section "Jeux" visible (si contenu)
  - Section "Divertissements" visible (si contenu)

- [ ] **Navigation horizontale**
  - Défilement horizontal fonctionne (souris, trackpad)
  - Défilement tactile fonctionne (mobile)
  - Aperçu des contenus au survol (desktop)

- [ ] **Recherche**
  - Barre de recherche visible dans le header
  - Recherche fonctionne (taper un titre)
  - Résultats s'affichent en popup
  - Clic sur un résultat redirige vers la page du contenu

- [ ] **Liens de navigation**
  - Lien "Films" → `/films`
  - Lien "Séries" → `/series`
  - Lien "Animes" → `/animes`
  - Lien "Documentaires" → `/documentaires`
  - Lien "Sports" → `/sports`
  - Lien "Jeux" → `/jeux`
  - Lien "Divertissements" → `/divertissements`
  - Lien "Tendances" → `/tendances`
  - Lien "Collection" → Redirige vers `/login` (si non connecté)

- [ ] **Responsive Design**
  - **Desktop** (1920x1080) : Layout complet visible
  - **Tablet** (768x1024) : Menu hamburger visible
  - **Mobile** (375x667) : Menu mobile fonctionne, contenu adapté

**Résultat** : ___ / 25 tests

---

### 1.2 Inscription

**URL** : `http://localhost:3000/register`

**Tests à effectuer** :

- [ ] **Affichage du formulaire**
  - Formulaire d'inscription visible
  - Tous les champs présents :
    - Nom complet
    - Email
    - Mot de passe
    - Confirmation du mot de passe
    - Téléphone (si requis)
  - Bouton "S'inscrire" visible

- [ ] **Validation des champs**

  **Nom complet** :
  - [ ] Message d'erreur si vide
  - [ ] Message d'erreur si < 3 caractères
  - [ ] Accepte les noms valides (minimum 3 caractères)
  - [ ] Accepte les espaces et caractères spéciaux

  **Email** :
  - [ ] Message d'erreur si vide
  - [ ] Message d'erreur si format invalide (`test@` → erreur)
  - [ ] Message d'erreur si format invalide (`test@example` → erreur)
  - [ ] Accepte les emails valides (`user@example.com` → OK)
  - [ ] Message d'erreur si email déjà utilisé

  **Mot de passe** :
  - [ ] Message d'erreur si vide
  - [ ] Message d'erreur si trop court (< 8 caractères)
  - [ ] Message d'erreur si pas de majuscule
  - [ ] Message d'erreur si pas de chiffre
  - [ ] Message d'erreur si pas de caractère spécial
  - [ ] Accepte les mots de passe forts (`Password123!` → OK)
  - [ ] Indicateur de force du mot de passe (si implémenté)

  **Confirmation du mot de passe** :
  - [ ] Message d'erreur si vide
  - [ ] Message d'erreur si ne correspond pas au mot de passe
  - [ ] Accepte si correspond au mot de passe

  **Téléphone** (si requis) :
  - [ ] Validation du format (+33 6 12 34 56 78)
  - [ ] Accepte les formats valides

- [ ] **Soumission du formulaire**

  **Cas valide** :
  - [ ] Remplir tous les champs avec des valeurs valides
  - [ ] Cliquer sur "S'inscrire"
  - [ ] Message de succès affiché
  - [ ] Redirection automatique vers `/dashboard` ou `/login`
  - [ ] Compte créé dans la base de données
  - [ ] Email de confirmation envoyé (si implémenté)

  **Cas invalides** :
  - [ ] Soumission avec champs vides → Messages d'erreur
  - [ ] Soumission avec email déjà utilisé → Message d'erreur spécifique
  - [ ] Soumission avec mot de passe faible → Message d'erreur
  - [ ] Soumission avec confirmation incorrecte → Message d'erreur

- [ ] **Protection anti-spam**
  - [ ] Impossible de soumettre plusieurs fois rapidement
  - [ ] Rate limiting fonctionne (5 tentatives max)
  - [ ] Message après trop de tentatives

**Résultat** : ___ / 28 tests

---

### 1.3 Connexion

**URL** : `http://localhost:3000/login`

**Tests à effectuer** :

- [ ] **Affichage du formulaire**
  - Formulaire de connexion visible
  - Champs Email et Mot de passe présents
  - Bouton "Se connecter" visible
  - Lien "Mot de passe oublié ?" visible
  - Lien "Créer un compte" visible

- [ ] **Validation des champs**
  - [ ] Message d'erreur si email vide
  - [ ] Message d'erreur si email invalide
  - [ ] Message d'erreur si mot de passe vide
  - [ ] Accepte les champs valides

- [ ] **Connexion réussie**
  - [ ] Remplir email et mot de passe valides
  - [ ] Cliquer sur "Se connecter"
  - [ ] Message de succès (optionnel)
  - [ ] Redirection vers `/dashboard`
  - [ ] Session créée et token stocké
  - [ ] Nom d'utilisateur affiché dans le header
  - [ ] Menu utilisateur accessible

- [ ] **Connexion échouée**
  - [ ] Email incorrect → Message d'erreur : "Email ou mot de passe incorrect"
  - [ ] Mot de passe incorrect → Message d'erreur : "Email ou mot de passe incorrect"
  - [ ] Les deux incorrects → Message d'erreur
  - [ ] Compte inexistant → Message d'erreur
  - [ ] Compte désactivé → Message d'erreur spécifique (si applicable)

- [ ] **Rate limiting anti-brute force**
  - [ ] Tenter 5 connexions incorrectes
  - [ ] Après 5 tentatives : Message d'avertissement
  - [ ] Compte verrouillé temporairement (si implémenté)
  - [ ] Attendre 15 minutes (ou délai configuré) → Peut réessayer

- [ ] **"Se souvenir de moi"**
  - [ ] Cocher la case "Se souvenir de moi"
  - [ ] Se connecter
  - [ ] Fermer le navigateur
  - [ ] Rouvrir le navigateur
  - [ ] Vérifier que la session persiste (si implémenté)

- [ ] **Mot de passe oublié**
  - [ ] Cliquer sur "Mot de passe oublié ?"
  - [ ] Redirection vers `/reset-password`
  - [ ] Formulaire de réinitialisation visible

**Résultat** : ___ / 20 tests

---

### 1.4 Réinitialisation du Mot de Passe

**URL** : `http://localhost:3000/reset-password`

**Tests à effectuer** :

- [ ] **Demande de réinitialisation**
  - [ ] Formulaire de demande visible
  - [ ] Champ email présent
  - [ ] Bouton "Envoyer le lien" visible
  - [ ] Lien "Retour à la connexion" visible

- [ ] **Validation**
  - [ ] Message d'erreur si email vide
  - [ ] Message d'erreur si email invalide
  - [ ] Message si email non trouvé : "Aucun compte trouvé avec cet email"

- [ ] **Envoi du lien**
  - [ ] Remplir avec un email valide existant
  - [ ] Cliquer sur "Envoyer le lien"
  - [ ] Message de succès : "Email de réinitialisation envoyé"
  - [ ] Email reçu (si implémenté)
  - [ ] Lien de réinitialisation dans l'email fonctionne

- [ ] **Nouveau mot de passe**
  - [ ] Accéder au formulaire via le lien (si implémenté)
  - [ ] Champ "Nouveau mot de passe" visible
  - [ ] Champ "Confirmer le nouveau mot de passe" visible
  - [ ] Validation du nouveau mot de passe (force requise)
  - [ ] Validation de la confirmation
  - [ ] Bouton "Réinitialiser" visible

- [ ] **Soumission**
  - [ ] Remplir avec un mot de passe fort
  - [ ] Cliquer sur "Réinitialiser"
  - [ ] Message de succès
  - [ ] Redirection vers `/login`
  - [ ] Connexion possible avec le nouveau mot de passe

**Résultat** : ___ / 15 tests

---

## 2. 📱 DASHBOARD UTILISATEUR

### 2.1 Page Dashboard (Connecté)

**URL** : `http://localhost:3000/dashboard`

**Tests à effectuer** :

- [ ] **Affichage général**
  - [ ] Header avec nom d'utilisateur visible
  - [ ] Menu de navigation visible
  - [ ] Onglets visibles : "Accueil", "Films", "Séries", "Ma Liste"
  - [ ] Contenu principal visible

- [ ] **Onglet "Accueil"**
  - [ ] Section "Continuer à regarder" visible (si historique)
  - [ ] Section "Recommandations" visible
  - [ ] Section "Tendances" visible
  - [ ] Section "Films récents" visible
  - [ ] Section "Séries récentes" visible
  - [ ] Carrousels défilent horizontalement

- [ ] **Onglet "Films"**
  - [ ] Liste de tous les films affichée
  - [ ] Filtres visibles (genre, année, recherche)
  - [ ] Pagination fonctionne (si > 20 films)
  - [ ] Clic sur un film → Redirige vers `/content/[id]`

- [ ] **Onglet "Séries"**
  - [ ] Liste de toutes les séries affichée
  - [ ] Filtres visibles
  - [ ] Pagination fonctionne
  - [ ] Clic sur une série → Redirige vers `/content/[id]`

- [ ] **Onglet "Ma Liste" (Watchlist)**
  - [ ] Liste des contenus ajoutés à la watchlist
  - [ ] Message si liste vide : "Votre liste est vide"
  - [ ] Bouton pour ajouter du contenu visible
  - [ ] Suppression d'un élément fonctionne

- [ ] **Menu utilisateur (header)**
  - [ ] Avatar/nom utilisateur cliquable
  - [ ] Menu déroulant visible avec options :
    - [ ] "Mon Profil"
    - [ ] "Paramètres"
    - [ ] "Ma Liste"
    - [ ] "Historique"
    - [ ] "Se déconnecter"

**Résultat** : ___ / 22 tests

---

### 2.2 Navigation Menu

**Tests à effectuer** :

- [ ] **Menu Desktop**
  - [ ] Tous les liens visibles
  - [ ] Lien actif souligné ou mis en évidence
  - [ ] Hover effects fonctionnent

- [ ] **Menu Mobile (Hamburger)**
  - [ ] Icône hamburger visible sur mobile/tablet
  - [ ] Clic ouvre le menu latéral
  - [ ] Menu se ferme en cliquant à l'extérieur
  - [ ] Menu se ferme en cliquant sur un lien
  - [ ] Tous les liens accessibles dans le menu mobile

- [ ] **Liens de navigation**
  - [ ] Films → `/films`
  - [ ] Séries → `/series`
  - [ ] Animes → `/animes`
  - [ ] Documentaires → `/documentaires`
  - [ ] Sports → `/sports`
  - [ ] Jeux → `/jeux`
  - [ ] Divertissements → `/divertissements`
  - [ ] Tendances → `/tendances`
  - [ ] Collection → `/collection` (si connecté)
  - [ ] Profil → `/profile` (si connecté)

**Résultat** : ___ / 14 tests

---

## 3. 🎬 CONSULTATION DE CONTENU

### 3.1 Page Liste Films

**URL** : `http://localhost:3000/films`

**Tests à effectuer** :

- [ ] **Affichage**
  - [ ] Titre "Films" visible
  - [ ] Liste de films affichée en grille
  - [ ] Images des films visibles
  - [ ] Titres des films visibles
  - [ ] Années/réalisateurs visibles (si configuré)

- [ ] **Filtres**
  - [ ] Filtre par genre fonctionne
  - [ ] Filtre par année fonctionne
  - [ ] Filtre par recherche fonctionne
  - [ ] Bouton "Réinitialiser les filtres" fonctionne

- [ ] **Tri**
  - [ ] Tri par date (plus récent) fonctionne
  - [ ] Tri par popularité fonctionne
  - [ ] Tri par note fonctionne
  - [ ] Tri par titre (A-Z) fonctionne

- [ ] **Pagination**
  - [ ] Pagination visible (si > 20 films)
  - [ ] Bouton "Suivant" fonctionne
  - [ ] Bouton "Précédent" fonctionne
  - [ ] Numéro de page visible
  - [ ] Navigation par numéro de page fonctionne

- [ ] **Interactions**
  - [ ] Clic sur un film → Redirige vers `/content/[id]`
  - [ ] Hover sur un film (desktop) → Aperçu/infos supplémentaires
  - [ ] Bouton "Ajouter à ma liste" fonctionne (si connecté)

**Résultat** : ___ / 16 tests

---

### 3.2 Page Liste Séries

**URL** : `http://localhost:3000/series`

**Tests à effectuer** :

- [ ] **Mêmes tests que Films** (16 tests)
  - [ ] Affichage de la liste
  - [ ] Filtres fonctionnent
  - [ ] Tri fonctionne
  - [ ] Pagination fonctionne
  - [ ] Interactions fonctionnent

**Résultat** : ___ / 16 tests

---

### 3.3 Pages Catégories (Animes, Documentaires, etc.)

**URLs** :
- `/animes`
- `/documentaires`
- `/sports`
- `/jeux`
- `/divertissements`
- `/tendances`

**Tests à effectuer** (pour chaque page) :

- [ ] **Affichage**
  - [ ] Titre de la catégorie visible
  - [ ] Liste de contenu affichée
  - [ ] Filtres et tri disponibles

**Résultat** : ___ / 18 tests (3 tests × 6 pages)

---

### 3.4 Page Détail Contenu

**URL** : `http://localhost:3000/content/[id]`

**Tests à effectuer** :

- [ ] **Affichage général**
  - [ ] Image principale (poster) visible
  - [ ] Titre visible
  - [ ] Année de sortie visible
  - [ ] Genres visibles
  - [ ] Note/rating visible
  - [ ] Description/synopsis visible
  - [ ] Casting/réalisateur visible (si configuré)
  - [ ] Durée visible (pour films)

- [ ] **Boutons d'action**
  - [ ] Bouton "Regarder" visible et fonctionne
  - [ ] Bouton "Ajouter à ma liste" visible et fonctionne
  - [ ] Bouton "Partager" visible (si implémenté)
  - [ ] Icône favori/coeur fonctionne

- [ ] **Pour les Séries**
  - [ ] Liste des saisons visible
  - [ ] Liste des épisodes par saison visible
  - [ ] Clic sur un épisode → Redirige vers `/watch/[id]`
  - [ ] Indicateur d'épisodes regardés visible
  - [ ] Numéro de saison/épisode visible

- [ ] **Section Recommandations**
  - [ ] Section "Contenus similaires" visible
  - [ ] Carrousel de recommandations défile
  - [ ] Clic sur une recommandation → Redirige vers sa page

- [ ] **Section Avis/Reviews**
  - [ ] Section avis visible
  - [ ] Liste des avis affichée
  - [ ] Formulaire d'ajout d'avis visible (si connecté)
  - [ ] Note en étoiles fonctionne
  - [ ] Soumission d'un avis fonctionne
  - [ ] Affichage de la note moyenne

- [ ] **Responsive**
  - [ ] Layout adapté mobile
  - [ ] Images redimensionnées
  - [ ] Menu burger fonctionne

**Résultat** : ___ / 28 tests

---

## 4. ▶️ VISIONNAGE VIDÉO

### 4.1 Page Lecteur Vidéo

**URL** : `http://localhost:3000/watch/[id]`

**Tests à effectuer** :

- [ ] **Chargement du lecteur**
  - [ ] Lecteur vidéo se charge (< 5 secondes)
  - [ ] Contrôles vidéo visibles (play, pause, volume, plein écran)
  - [ ] Barre de progression visible
  - [ ] Temps actuel / durée totale visible

- [ ] **Contrôles de lecture**
  - [ ] Bouton Play démarre la lecture
  - [ ] Bouton Pause arrête la lecture
  - [ ] Clic sur la vidéo → Play/Pause toggle
  - [ ] Barre de progression cliquable (saut de position)
  - [ ] Volume ajustable (slider)
  - [ ] Bouton mute/unmute fonctionne
  - [ ] Bouton plein écran fonctionne
  - [ ] Sortie du plein écran (Échap) fonctionne

- [ ] **Raccourcis clavier** (desktop)
  - [ ] Espace → Play/Pause
  - [ ] Flèche gauche → -10 secondes
  - [ ] Flèche droite → +10 secondes
  - [ ] Flèche haut → Volume +
  - [ ] Flèche bas → Volume -
  - [ ] M → Mute/Unmute
  - [ ] F → Plein écran
  - [ ] Échap → Quitter plein écran

- [ ] **Types de sources vidéo**
  - [ ] **MP4 Direct** : Lecture fluide
  - [ ] **HLS (.m3u8)** : Lecture avec qualité adaptative
  - [ ] **Webtorrent** : Lecture torrent (si activé)
  - [ ] **iframe** : Embed (YouTube, Vimeo, etc.)
  - [ ] **YouTube** : Lecteur YouTube intégré

- [ ] **Qualité vidéo** (si HLS)
  - [ ] Menu qualité disponible
  - [ ] Changement de qualité fonctionne
  - [ ] Qualité adaptative fonctionne

- [ ] **Progression de visionnage**
  - [ ] Progression sauvegardée automatiquement
  - [ ] Reprise au bon moment au retour
  - [ ] Indicateur "Continuer à regarder" visible sur la page du contenu

- [ ] **Pour les séries**
  - [ ] Lecteur d'épisode fonctionne
  - [ ] Navigation épisode suivant/précédent fonctionne
  - [ ] Auto-play épisode suivant (si activé)
  - [ ] Sélection de saison/épisode depuis le lecteur

- [ ] **Contenu Premium**
  - [ ] Message si contenu premium (si utilisateur non premium)
  - [ ] Redirection vers page abonnement
  - [ ] Lecture possible si utilisateur premium

- [ ] **Responsive**
  - [ ] Lecteur adapté mobile
  - [ ] Contrôles tactiles fonctionnent
  - [ ] Plein écran mobile fonctionne

**Résultat** : ___ / 32 tests

---

### 4.2 Auto-play et Recommandations

**Tests à effectuer** :

- [ ] **Auto-play épisode suivant**
  - [ ] Fin d'un épisode → Compte à rebours visible
  - [ ] Compte à rebours → Lecture automatique épisode suivant
  - [ ] Bouton "Annuler" arrête l'auto-play
  - [ ] Paramètre désactiver auto-play fonctionne

- [ ] **Mode Binge Watch** (si implémenté)
  - [ ] Activation du mode binge watch
  - [ ] Lecture automatique épisodes suivants
  - [ ] Désactivation possible

**Résultat** : ___ / 6 tests

---

## 5. 👤 PROFIL UTILISATEUR

### 5.1 Page Profil

**URL** : `http://localhost:3000/profile`

**Tests à effectuer** :

- [ ] **Affichage du profil**
  - [ ] Nom d'utilisateur visible
  - [ ] Email visible
  - [ ] Avatar/photo de profil visible (si configuré)
  - [ ] Date d'inscription visible
  - [ ] Statut Premium visible (si applicable)

- [ ] **Édition du profil**
  - [ ] Bouton "Modifier le profil" visible
  - [ ] Formulaire d'édition s'ouvre
  - [ ] Modification du nom possible
  - [ ] Modification de l'email possible (avec confirmation)
  - [ ] Upload d'avatar fonctionne (si implémenté)
  - [ ] Sauvegarde des modifications fonctionne
  - [ ] Message de confirmation après sauvegarde

- [ ] **Changement de mot de passe**
  - [ ] Section "Changement de mot de passe" visible
  - [ ] Champ "Mot de passe actuel" présent
  - [ ] Champ "Nouveau mot de passe" présent
  - [ ] Champ "Confirmer nouveau mot de passe" présent
  - [ ] Validation du mot de passe actuel
  - [ ] Validation du nouveau mot de passe (force requise)
  - [ ] Changement réussi avec message de confirmation

- [ ] **Statistiques**
  - [ ] Nombre de films regardés visible
  - [ ] Nombre de séries regardées visible
  - [ ] Temps total de visionnage visible (si implémenté)
  - [ ] Date de dernière connexion visible

**Résultat** : ___ / 20 tests

---

### 5.2 Paramètres

**URL** : `http://localhost:3000/settings`

**Tests à effectuer** :

- [ ] **Paramètres de lecture**
  - [ ] Auto-play vidéo (ON/OFF) fonctionne
  - [ ] Auto-play épisode suivant (ON/OFF) fonctionne
  - [ ] Qualité vidéo par défaut (si applicable)
  - [ ] Sous-titres par défaut (si applicable)

- [ ] **Paramètres de compte**
  - [ ] Notification email (ON/OFF) fonctionne
  - [ ] Notification push (ON/OFF) fonctionne
  - [ ] Langue de l'interface (si multilingue)
  - [ ] Thème (clair/sombre/auto) fonctionne

- [ ] **Paramètres de confidentialité**
  - [ ] Visibilité du profil (public/privé)
  - [ ] Partage d'activité (ON/OFF)
  - [ ] Historique de visionnage (activer/désactiver)

- [ ] **Sauvegarde**
  - [ ] Tous les paramètres se sauvegardent
  - [ ] Persistance après rechargement de page

**Résultat** : ___ / 15 tests

---

## 6. ⭐ FAVORIS ET WATCHLIST

### 6.1 Ajout aux Favoris / Watchlist

**Tests à effectuer** :

- [ ] **Depuis la page de contenu**
  - [ ] Bouton "Ajouter à ma liste" visible
  - [ ] Clic ajoute le contenu à la watchlist
  - [ ] Message de confirmation affiché
  - [ ] Icône change (coeur plein, etc.)

- [ ] **Depuis la carte de contenu (hover)**
  - [ ] Icône favori visible au survol (desktop)
  - [ ] Clic ajoute aux favoris
  - [ ] Confirmation visuelle

- [ ] **Depuis le lecteur vidéo**
  - [ ] Bouton favori visible dans le lecteur
  - [ ] Ajout/suppression fonctionne

**Résultat** : ___ / 9 tests

---

### 6.2 Page Watchlist / Ma Liste

**URL** : `/dashboard` → Onglet "Ma Liste"

**Tests à effectuer** :

- [ ] **Affichage**
  - [ ] Liste des contenus ajoutés visible
  - [ ] Images et titres visibles
  - [ ] Date d'ajout visible (si configuré)

- [ ] **Actions**
  - [ ] Clic sur un contenu → Redirige vers sa page
  - [ ] Bouton "Supprimer" fonctionne
  - [ ] Confirmation avant suppression
  - [ ] Message après suppression

- [ ] **Tri et filtres**
  - [ ] Tri par date d'ajout fonctionne
  - [ ] Tri par titre fonctionne
  - [ ] Filtre par type (films/séries) fonctionne

- [ ] **État vide**
  - [ ] Message si liste vide : "Votre liste est vide"
  - [ ] Bouton "Découvrir du contenu" redirige vers la page d'accueil

**Résultat** : ___ / 11 tests

---

## 7. 🔍 RECHERCHE

### 7.1 Fonctionnalité de Recherche

**Tests à effectuer** :

- [ ] **Barre de recherche (header)**
  - [ ] Barre de recherche visible dans le header
  - [ ] Placeholder "Rechercher..." visible
  - [ ] Icône de recherche visible

- [ ] **Recherche basique**
  - [ ] Taper un terme de recherche
  - [ ] Résultats s'affichent en popup (recherche en temps réel)
  - [ ] Résultats incluent films, séries, etc.
  - [ ] Images et titres visibles dans les résultats
  - [ ] Clic sur un résultat → Redirige vers la page du contenu

- [ ] **Recherche avancée**
  - [ ] Accès à la page de recherche complète (si `/search` existe)
  - [ ] Filtres de recherche disponibles (genre, année, type)
  - [ ] Résultats paginés
  - [ ] Tri des résultats

- [ ] **Cas limites**
  - [ ] Recherche vide → Message "Aucun résultat"
  - [ ] Recherche inexistante → Message "Aucun résultat trouvé"
  - [ ] Recherche avec caractères spéciaux → Fonctionne
  - [ ] Recherche avec accents → Fonctionne

- [ ] **Historique de recherche** (si implémenté)
  - [ ] Historique visible dans le popup
  - [ ] Clic sur historique réexécute la recherche

**Résultat** : ___ / 14 tests

---

## 8. 📱 PWA (PROGRESSIVE WEB APP)

### 8.1 Installation PWA

**Tests à effectuer** :

- [ ] **Prompt d'installation**
  - [ ] Bannière d'installation apparaît (Chrome/Edge)
  - [ ] Bouton "Installer" fonctionne
  - [ ] Application installée sur le bureau/écran d'accueil

- [ ] **Utilisation hors ligne**
  - [ ] Ouvrir l'app installée
  - [ ] Activer le mode avion
  - [ ] Page d'accueil se charge (service worker)
  - [ ] Contenu en cache accessible
  - [ ] Message "Mode hors ligne" visible

- [ ] **Synchronisation**
  - [ ] Revenir en ligne
  - [ ] Synchronisation automatique (si implémentée)
  - [ ] Données à jour

**Résultat** : ___ / 9 tests

---

## 9. 📊 COLLECTION ET STATISTIQUES

### 9.1 Page Collection

**URL** : `http://localhost:3000/collection`

**Tests à effectuer** :

- [ ] **Affichage**
  - [ ] Page collection accessible (si connecté)
  - [ ] Statistiques visibles :
    - [ ] Nombre de films regardés
    - [ ] Nombre de séries regardées
    - [ ] Temps total de visionnage
  - [ ] Graphiques/visualisations (si implémentés)

- [ ] **Historique de visionnage**
  - [ ] Liste des contenus regardés visible
  - [ ] Date de visionnage visible
  - [ ] Progression visible (pour séries)
  - [ ] Bouton "Continuer à regarder" fonctionne

- [ ] **Filtres**
  - [ ] Filtre par type (films/séries)
  - [ ] Filtre par date
  - [ ] Tri par date de visionnage

**Résultat** : ___ / 10 tests

---

## 10. 💳 ABONNEMENT PREMIUM

### 10.1 Page Abonnement

**URL** : `http://localhost:3000/subscription`

**Tests à effectuer** :

- [ ] **Affichage**
  - [ ] Page d'abonnement visible
  - [ ] Avantages Premium listés
  - [ ] Prix affiché
  - [ ] Bouton "S'abonner" visible

- [ ] **Activation avec code**
  - [ ] Champ "Code Premium" visible
  - [ ] Entrer un code valide
  - [ ] Bouton "Activer" fonctionne
  - [ ] Message de succès
  - [ ] Statut Premium activé
  - [ ] Accès au contenu premium débloqué

- [ ] **Code invalide**
  - [ ] Entrer un code invalide
  - [ ] Message d'erreur affiché
  - [ ] Code déjà utilisé → Message d'erreur

- [ ] **Historique Premium**
  - [ ] Section historique visible (si utilisateur premium)
  - [ ] Codes utilisés listés
  - [ ] Date d'expiration visible

**Résultat** : ___ / 12 tests

---

## 11. 📱 RESPONSIVE DESIGN

### 11.1 Tests Multi-Plateformes

**Tests à effectuer** :

- [ ] **Desktop (1920x1080)**
  - [ ] Layout complet visible
  - [ ] Menu horizontal visible
  - [ ] Toutes les fonctionnalités accessibles
  - [ ] Hover effects fonctionnent

- [ ] **Tablet (768x1024)**
  - [ ] Menu hamburger visible
  - [ ] Layout adapté
  - [ ] Grille de contenu adaptée
  - [ ] Navigation tactile fonctionne

- [ ] **Mobile (375x667)**
  - [ ] Menu mobile fonctionne
  - [ ] Grille 2 colonnes (au lieu de 6)
  - [ ] Lecteur vidéo adapté
  - [ ] Formulaires adaptés
  - [ ] Tous les boutons accessibles
  - [ ] Scrolling vertical/horizontal fonctionne

- [ ] **Orientation**
  - [ ] Portrait → Layout vertical
  - [ ] Paysage → Layout adapté
  - [ ] Rotation dynamique fonctionne

**Résultat** : ___ / 12 tests

---

## 12. ⚡ PERFORMANCE

### 12.1 Tests de Performance

**Tests à effectuer** :

- [ ] **Temps de chargement**
  - [ ] Page d'accueil < 3 secondes
  - [ ] Page dashboard < 3 secondes
  - [ ] Page contenu < 2 secondes
  - [ ] Lecteur vidéo démarre < 5 secondes

- [ ] **Optimisation images**
  - [ ] Images chargent progressivement (lazy loading)
  - [ ] Images optimisées (pas trop lourdes)
  - [ ] Placeholders visibles pendant le chargement

- [ ] **Cache**
  - [ ] Rechargement de page rapide (cache)
  - [ ] Navigation entre pages fluide

- [ ] **Scrolling**
  - [ ] Défilement fluide (60 FPS)
  - [ ] Pas de lag sur les carrousels
  - [ ] Infinite scroll fonctionne (si implémenté)

**Résultat** : ___ / 10 tests

---

## 13. 🔒 SÉCURITÉ ET PROTECTION

### 13.1 Tests de Sécurité Utilisateur

**Tests à effectuer** :

- [ ] **Protection des routes**
  - [ ] Tentative d'accès à `/dashboard` sans connexion → Redirection `/login`
  - [ ] Tentative d'accès à `/profile` sans connexion → Redirection `/login`
  - [ ] Session expire → Redirection `/login`

- [ ] **Validation des entrées**
  - [ ] Tentative XSS dans les champs → Bloquée
  - [ ] Tentative injection SQL → Bloquée
  - [ ] Caractères spéciaux sanitized

- [ ] **Rate limiting**
  - [ ] Trop de tentatives de connexion → Bloqué temporairement
  - [ ] Trop de requêtes → Limité

**Résultat** : ___ / 7 tests

---

## 📊 RÉSUMÉ FINAL

### Total de Tests

| Catégorie | Nombre de Tests |
|-----------|----------------|
| 1. Authentification | 88 |
| 2. Dashboard | 36 |
| 3. Consultation Contenu | 78 |
| 4. Visionnage Vidéo | 38 |
| 5. Profil Utilisateur | 35 |
| 6. Favoris/Watchlist | 20 |
| 7. Recherche | 14 |
| 8. PWA | 9 |
| 9. Collection | 10 |
| 10. Abonnement | 12 |
| 11. Responsive | 12 |
| 12. Performance | 10 |
| 13. Sécurité | 7 |
| **TOTAL** | **369 tests** |

---

## ✅ CHECKLIST FINALE

### Tests Critiques (À faire en priorité)
- [ ] Authentification (inscription, connexion)
- [ ] Visionnage vidéo (tous types de sources)
- [ ] Navigation entre pages
- [ ] Responsive mobile
- [ ] Protection des routes

### Tests Recommandés (Avant production)
- [ ] Tous les tests de contenu
- [ ] Tous les tests de profil
- [ ] Tests PWA
- [ ] Tests de performance

### Tests Optionnels (Amélioration continue)
- [ ] Tests de compatibilité navigateurs
- [ ] Tests d'accessibilité (A11y)
- [ ] Tests de charge (stress testing)

---

## 📝 NOTES DE TEST

**Date de test** : ___/___/____  
**Testeur** : ___________________  
**Environnement** : ___________________  
**Navigateur** : ___________________  
**Résultats** : ___ / 369 tests réussis

---

## 🐛 BUGS IDENTIFIÉS

| # | Description | Gravité | Page | Statut |
|---|-------------|---------|------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 💡 AMÉLIORATIONS SUGGÉRÉES

1. 
2. 
3. 

---

**Document créé le** : 31/10/2025  
**Version** : 1.0.0  
**Statut** : ✅ Guide complet prêt pour les tests

