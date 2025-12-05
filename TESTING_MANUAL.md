# 🧪 GUIDE DE TEST MANUEL - ATIHA

**Date de création** : 31/10/2025  
**Version testée** : 1.0.0  
**Environnement** : Développement / Production

---

## 📋 PRÉPARATION DES TESTS

### Prérequis
- [ ] Serveur de développement lancé : `npm run dev`
- [ ] Navigateur(s) à tester : Chrome, Firefox, Safari (mobile)
- [ ] Compte test utilisateur créé
- [ ] Compte admin disponible
- [ ] Quelques contenus ajoutés (films, séries)

### Environnements de test
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## ✅ CHECKLIST DE TESTS

---

## 1. 🔐 AUTHENTIFICATION UTILISATEUR

### 1.1 Inscription
**Page** : `/register`

- [ ] ✅ Affichage du formulaire d'inscription
- [ ] ✅ Validation du nom (minimum 3 caractères)
- [ ] ✅ Validation de l'email (format valide)
- [ ] ✅ Validation du mot de passe (force requise)
- [ ] ✅ Confirmation du mot de passe (correspondance)
- [ ] ✅ Validation du numéro de téléphone (si requis)
- [ ] ✅ Message d'erreur si email déjà utilisé
- [ ] ✅ Message de succès après inscription
- [ ] ✅ Redirection automatique après inscription
- [ ] ✅ Email de confirmation (si implémenté)
- [ ] ✅ Protection contre les soumissions multiples (rate limiting)

**Scénarios à tester** :
```
✅ Email valide : user@example.com
✅ MDP fort : AtihaTest2025@!
✅ Données complètes valides
❌ Email invalide : test@
❌ MDP faible : 123
❌ MDP non correspondant
❌ Email déjà utilisé
```

**Résultat** : ___ / 12 tests

---

### 1.2 Connexion
**Page** : `/login`

- [ ] ✅ Affichage du formulaire de connexion
- [ ] ✅ Connexion avec email/mot de passe valides
- [ ] ✅ Message d'erreur si credentials invalides
- [ ] ✅ Redirection après connexion réussie
- [ ] ✅ Mémorisation de session (si "Se souvenir de moi")
- [ ] ✅ Lien "Mot de passe oublié" fonctionne
- [ ] ✅ Rate limiting anti-brute force (5 tentatives max)
- [ ] ✅ Message après 5 tentatives échouées
- [ ] ✅ Compte verrouillé temporairement (si implémenté)

**Scénarios à tester** :
```
✅ Credentials valides
❌ Email incorrect
❌ Mot de passe incorrect
❌ Les deux incorrects
❌ 5 tentatives échouées → verrouillage
```

**Résultat** : ___ / 9 tests

---

### 1.3 Réinitialisation du mot de passe
**Page** : `/reset-password`

- [ ] ✅ Affichage du formulaire
- [ ] ✅ Validation de l'email
- [ ] ✅ Message si email non trouvé
- [ ] ✅ Message de succès si email envoyé
- [ ] ✅ Lien de réinitialisation dans l'email (si implémenté)
- [ ] ✅ Formulaire de nouveau mot de passe fonctionne
- [ ] ✅ Validation du nouveau mot de passe
- [ ] ✅ Confirmation du nouveau mot de passe
- [ ] ✅ Redirection après réinitialisation

**Résultat** : ___ / 8 tests

---

## 2. 🎬 NAVIGATION ET INTERFACE

### 2.1 Page d'accueil
**Page** : `/`

- [ ] ✅ Affichage correct de la page
- [ ] ✅ Carrousel/tendances visible
- [ ] ✅ Sections de contenu visibles (Films, Séries, etc.)
- [ ] ✅ Navigation responsive (menu mobile)
- [ ] ✅ Logo et branding corrects
- [ ] ✅ Footer visible avec liens
- [ ] ✅ Temps de chargement < 3 secondes
- [ ] ✅ Images optimisées (chargement progressif)
- [ ] ✅ Liens de navigation fonctionnent

**Résultat** : ___ / 9 tests

---

### 2.2 Menu de navigation
**Navigation globale**

- [ ] ✅ Menu desktop visible
- [ ] ✅ Menu mobile (hamburger) fonctionne
- [ ] ✅ Tous les liens fonctionnent :
  - [ ] Films
  - [ ] Séries
  - [ ] Animes
  - [ ] Documentaires
  - [ ] Sports
  - [ ] Jeux
  - [ ] Divertissements
  - [ ] Tendances
  - [ ] Collection (si connecté)
  - [ ] Profile (si connecté)
  - [ ] Déconnexion (si connecté)
  - [ ] Connexion/Inscription (si non connecté)
- [ ] ✅ Indicateur de page active
- [ ] ✅ Menu responsive (mobile/tablet)

**Résultat** : ___ / 15 tests

---

## 3. 🎥 GESTION DU CONTENU

### 3.1 Liste des contenus
**Pages** : `/films`, `/series`, `/animes`, etc.

- [ ] ✅ Affichage de la liste de contenus
- [ ] ✅ Images d'affiche chargées correctement
- [ ] ✅ Informations visibles (titre, année, genre)
- [ ] ✅ Pagination fonctionne (si > 20 contenus)
- [ ] ✅ Filtres fonctionnent (genre, année, etc.)
- [ ] ✅ Tri fonctionne (date, popularité, etc.)
- [ ] ✅ Recherche fonctionne
- [ ] ✅ Lien vers détail du contenu fonctionne
- [ ] ✅ Chargement progressif des images
- [ ] ✅ Responsive design (grid adaptatif)

**Résultat** : ___ / 10 tests

---

### 3.2 Détail d'un contenu
**Page** : `/content/[id]`

- [ ] ✅ Affichage des détails complets
- [ ] ✅ Image d'affiche haute résolution
- [ ] ✅ Informations : titre, synopsis, acteurs, réalisateur
- [ ] ✅ Genres et catégories
- [ ] ✅ Bouton "Regarder" visible
- [ ] ✅ Bouton "Ajouter aux favoris" fonctionne
- [ ] ✅ Bouton "Ajouter à ma liste" fonctionne
- [ ] ✅ Aperçu vidéo (si disponible)
- [ ] ✅ Contenu similaire suggéré
- [ ] ✅ Responsive design

**Résultat** : ___ / 10 tests

---

### 3.3 Recherche
**Page** : `/search`

- [ ] ✅ Champ de recherche visible
- [ ] ✅ Recherche en temps réel (si implémenté)
- [ ] ✅ Recherche par titre fonctionne
- [ ] ✅ Recherche par genre fonctionne
- [ ] ✅ Recherche par acteur/réalisateur
- [ ] ✅ Message "Aucun résultat" si vide
- [ ] ✅ Résultats pertinents
- [ ] ✅ Tri des résultats
- [ ] ✅ Filtres sur résultats
- [ ] ✅ Historique de recherche (si implémenté)

**Résultat** : ___ / 9 tests

---

## 4. ▶️ LECTEUR VIDÉO

### 4.1 Chargement du lecteur
**Page** : `/watch/[id]`

- [ ] ✅ Lecteur vidéo se charge
- [ ] ✅ Affiche correctement selon le type :
  - [ ] Vidéo directe (MP4)
  - [ ] HLS (.m3u8)
  - [ ] Iframe (supervideo.cc, dsvplay.com, voe.sx)
  - [ ] YouTube (si applicable)
  - [ ] Vimeo (si applicable)
- [ ] ✅ Contrôles vidéo fonctionnent (play, pause, volume, fullscreen)
- [ ] ✅ Qualité vidéo sélectionnable (si multiple)
- [ ] ✅ Sous-titres fonctionnent (si disponibles)
- [ ] ✅ Plein écran fonctionne
- [ ] ✅ Barre de progression fonctionne
- [ ] ✅ Temps de chargement acceptable

**Résultat** : ___ / 11 tests

---

### 4.2 Formats spécifiques

#### Format HLS
- [ ] ✅ Vidéo HLS démarre correctement
- [ ] ✅ Adaptation de qualité (si multi-bitrate)
- [ ] ✅ Buffering fluide
- [ ] ✅ Pas d'erreurs de lecture

#### Format iframe
- [ ] ✅ Iframe se charge correctement
- [ ] ✅ Plein écran fonctionne (corrigé récemment)
- [ ] ✅ Pas d'erreurs CORS
- [ ] ✅ Contrôles du lecteur externe accessibles

#### Format direct (MP4)
- [ ] ✅ Vidéo MP4 se charge
- [ ] ✅ Téléchargement progressif
- [ ] ✅ Lecture fluide

**Résultat** : ___ / 11 tests

---

### 4.3 Expérience utilisateur
- [ ] ✅ Lecture automatique (si autoplay activé)
- [ ] ✅ Sauvegarde de la position de lecture
- [ ] ✅ Reprendre où on s'est arrêté
- [ ] ✅ Pas de coupures/erreurs
- [ ] ✅ Responsive (mobile/tablet/desktop)
- [ ] ✅ Mode plein écran sur mobile
- [ ] ✅ Contrôles tactiles (mobile)

**Résultat** : ___ / 7 tests

---

## 5. ⭐ FONCTIONNALITÉS UTILISATEUR

### 5.1 Favoris
- [ ] ✅ Ajouter un contenu aux favoris
- [ ] ✅ Retirer des favoris
- [ ] ✅ Voir la liste des favoris (`/collection` ou `/profile`)
- [ ] ✅ Favoris persistants après déconnexion/reconnexion
- [ ] ✅ Badge/indicateur sur les favoris
- [ ] ✅ Tri/filtre des favoris

**Résultat** : ___ / 6 tests

---

### 5.2 Historique de visionnage
- [ ] ✅ Historique enregistré automatiquement
- [ ] ✅ Position de lecture sauvegardée
- [ ] ✅ Voir l'historique (`/dashboard` ou `/profile`)
- [ ] ✅ Reprendre où on s'est arrêté
- [ ] ✅ Effacer l'historique
- [ ] ✅ Historique persisté après déconnexion

**Résultat** : ___ / 6 tests

---

### 5.3 Profil utilisateur
**Page** : `/profile`

- [ ] ✅ Affichage des informations du profil
- [ ] ✅ Modification du nom
- [ ] ✅ Modification de l'email
- [ ] ✅ Modification du mot de passe
- [ ] ✅ Téléchargement de photo de profil (si implémenté)
- [ ] ✅ Préférences utilisateur
- [ ] ✅ Statistiques de visionnage (si implémenté)
- [ ] ✅ Liste des favoris
- [ ] ✅ Historique de visionnage
- [ ] ✅ Bouton de suppression de compte (si implémenté)

**Résultat** : ___ / 10 tests

---

### 5.4 Paramètres
**Page** : `/settings`

- [ ] ✅ Affichage des paramètres
- [ ] ✅ Préférences de qualité vidéo
- [ ] ✅ Préférences de sous-titres
- [ ] ✅ Préférences de lecture (autoplay, etc.)
- [ ] ✅ Notifications (si implémenté)
- [ ] ✅ Langue (si implémenté)
- [ ] ✅ Sauvegarde des paramètres
- [ ] ✅ Paramètres persistés

**Résultat** : ___ / 8 tests

---

## 6. 👨‍💼 PANEL ADMINISTRATEUR

### 6.1 Connexion admin
**Page** : `/admin/login`

- [ ] ✅ Formulaire de connexion admin visible
- [ ] ✅ Connexion avec identifiants admin valides
- [ ] ✅ Code de sécurité requis (si configuré)
- [ ] ✅ Message d'erreur si credentials invalides
- [ ] ✅ Rate limiting (5 tentatives max)
- [ ] ✅ Verrouillage temporaire après 5 échecs
- [ ] ✅ Redirection vers dashboard admin
- [ ] ✅ Session admin sécurisée

**Scénarios** :
```
✅ Username + Password + Security Code valides
❌ Username incorrect
❌ Password incorrect
❌ Security Code incorrect
❌ 5 tentatives échouées → verrouillage
```

**Résultat** : ___ / 8 tests

---

### 6.2 Dashboard admin
**Page** : `/admin/dashboard`

- [ ] ✅ Affichage du dashboard
- [ ] ✅ Statistiques utilisateurs
- [ ] ✅ Statistiques de contenus
- [ ] ✅ Graphiques/visualisations (si implémentés)
- [ ] ✅ Activités récentes
- [ ] ✅ Alertes/notifications
- [ ] ✅ Navigation vers autres sections admin
- [ ] ✅ Responsive design

**Résultat** : ___ / 8 tests

---

### 6.3 Gestion des utilisateurs
**Page** : `/admin/users`

- [ ] ✅ Liste des utilisateurs affichée
- [ ] ✅ Informations utilisateurs visibles
- [ ] ✅ Recherche d'utilisateurs
- [ ] ✅ Filtres (actif, inactif, premium, etc.)
- [ ] ✅ Détails d'un utilisateur
- [ ] ✅ Modification d'un utilisateur
- [ ] ✅ Suppression d'un utilisateur (avec confirmation)
- [ ] ✅ Attribution rôle admin (si applicable)
- [ ] ✅ Attribution statut premium
- [ ] ✅ Export des utilisateurs (si implémenté)

**Résultat** : ___ / 10 tests

---

### 6.4 Ajout de contenu
**Page** : `/admin/add-content`

- [ ] ✅ Formulaire d'ajout visible
- [ ] ✅ Tous les champs fonctionnels :
  - [ ] Titre
  - [ ] Description/Synopsis
  - [ ] Année
  - [ ] Genre (multi-sélection)
  - [ ] Type (Film, Série, etc.)
  - [ ] URL de l'affiche (validation des domaines)
  - [ ] URL d'aperçu vidéo (optionnel)
  - [ ] URL vidéo principale
  - [ ] Acteurs
  - [ ] Réalisateur
  - [ ] Durée
  - [ ] Saison/Épisode (si série)
- [ ] ✅ Validation des champs requis
- [ ] ✅ Validation des URLs (domaines autorisés)
- [ ] ✅ Détection automatique du type de vidéo
- [ ] ✅ Prévisualisation de l'affiche (si URL fournie)
- [ ] ✅ Soumission du formulaire
- [ ] ✅ Message de succès après ajout
- [ ] ✅ Redirection ou réinitialisation du formulaire

**Domaines images testés** :
```
✅ media.themoviedb.org
✅ www.cpasmieux.is
✅ cpasbienfr.fr
✅ www.torrent911.app
✅ www5.torrent9.to
✅ www.filmoflix.is
✅ www1.oxtorrent.co
```

**Domaines vidéo testés** :
```
✅ supervideo.cc/e/...
✅ dsvplay.com/e/...
✅ voe.sx/...
✅ Autres formats (HLS, MP4 direct)
```

**Résultat** : ___ / 18 tests

---

### 6.5 Édition de contenu
**Page** : `/admin/data-management` ou similaire

- [ ] ✅ Liste des contenus éditables
- [ ] ✅ Recherche de contenu
- [ ] ✅ Ouverture formulaire d'édition
- [ ] ✅ Modification des champs
- [ ] ✅ Validation des modifications
- [ ] ✅ Sauvegarde des modifications
- [ ] ✅ Suppression de contenu (avec confirmation)
- [ ] ✅ Message de succès/erreur

**Résultat** : ___ / 8 tests

---

### 6.6 Sécurité admin
**Page** : `/admin/security`

- [ ] ✅ Affichage de la page de sécurité
- [ ] ✅ Logs de sécurité visibles
- [ ] ✅ Tentatives de connexion suspectes affichées
- [ ] ✅ Statistiques de sécurité
- [ ] ✅ Actions de sécurité disponibles
- [ ] ✅ Export des logs (si implémenté)
- [ ] ✅ Filtres sur les logs
- [ ] ✅ Détails d'un événement de sécurité

**Résultat** : ___ / 8 tests

---

### 6.7 Analytics
**Page** : `/admin/analytics`

- [ ] ✅ Graphiques/statistiques affichés
- [ ] ✅ Métriques utilisateurs
- [ ] ✅ Métriques de contenu
- [ ] ✅ Métriques de visionnage
- [ ] ✅ Filtres par période
- [ ] ✅ Export de données (si implémenté)

**Résultat** : ___ / 6 tests

---

## 7. 📱 RESPONSIVE DESIGN

### 7.1 Desktop (1920x1080)
- [ ] ✅ Layout complet visible
- [ ] ✅ Menu horizontal fonctionnel
- [ ] ✅ Grille de contenus optimale
- [ ] ✅ Tous les éléments accessibles
- [ ] ✅ Pas de débordement horizontal

**Résultat** : ___ / 5 tests

---

### 7.2 Tablet (768x1024)
- [ ] ✅ Layout adapté
- [ ] ✅ Menu responsive (hamburger ou adapté)
- [ ] ✅ Grille adaptée (2-3 colonnes)
- [ ] ✅ Tous les éléments accessibles
- [ ] ✅ Navigation tactile fonctionnelle

**Résultat** : ___ / 5 tests

---

### 7.3 Mobile (375x667)
- [ ] ✅ Layout mobile optimisé
- [ ] ✅ Menu hamburger fonctionnel
- [ ] ✅ Grille 1 colonne
- [ ] ✅ Contrôles tactiles
- [ ] ✅ Pas de débordement horizontal
- [ ] ✅ Boutons accessibles (taille suffisante)
- [ ] ✅ Formulaire utilisable
- [ ] ✅ Lecteur vidéo adapté

**Résultat** : ___ / 8 tests

---

## 8. 🔒 SÉCURITÉ ET PERFORMANCE

### 8.1 Sécurité
- [ ] ✅ HTTPS forcé en production
- [ ] ✅ Headers de sécurité présents
- [ ] ✅ Pas de secrets exposés dans le code
- [ ] ✅ Validation des entrées (XSS)
- [ ] ✅ Rate limiting fonctionne
- [ ] ✅ Protection CSRF (si formulaires)
- [ ] ✅ Données sensibles chiffrées
- [ ] ✅ Logs de sécurité actifs

**Résultat** : ___ / 8 tests

---

### 8.2 Performance
- [ ] ✅ Temps de chargement page < 3s
- [ ] ✅ Images optimisées (Next.js Image)
- [ ] ✅ Lazy loading des images
- [ ] ✅ Code splitting fonctionnel
- [ ] ✅ Cache fonctionnel
- [ ] ✅ Pas d'erreurs console
- [ ] ✅ Lighthouse score > 90 (si testé)

**Résultat** : ___ / 7 tests

---

## 9. 🚀 PWA (Progressive Web App)

### 9.1 Installation
- [ ] ✅ Prompt d'installation disponible
- [ ] ✅ Installation sur mobile fonctionne
- [ ] ✅ Installation sur desktop fonctionne
- [ ] ✅ Icône de l'application correcte
- [ ] ✅ Nom de l'application correct

**Résultat** : ___ / 5 tests

---

### 9.2 Fonctionnalités offline
- [ ] ✅ Service Worker actif
- [ ] ✅ Page d'accueil fonctionne offline
- [ ] ✅ Cache des ressources statiques
- [ ] ✅ Message "Hors ligne" approprié

**Résultat** : ___ / 4 tests

---

## 10. 🐛 TESTS D'ERREURS ET EDGE CASES

### 10.1 Gestion des erreurs
- [ ] ✅ Page 404 fonctionne (`/404`)
- [ ] ✅ Erreur 500 gérée gracieusement
- [ ] ✅ Messages d'erreur clairs
- [ ] ✅ Erreurs réseau gérées
- [ ] ✅ Timeout de requêtes géré
- [ ] ✅ Erreur vidéo gérée (lecteur)
- [ ] ✅ Erreur image (fallback)

**Résultat** : ___ / 7 tests

---

### 10.2 Edge cases
- [ ] ✅ Contenu sans image (fallback)
- [ ] ✅ Contenu sans vidéo (message approprié)
- [ ] ✅ URL invalide
- [ ] ✅ Données manquantes
- [ ] ✅ Caractères spéciaux dans recherche
- [ ] ✅ Très long texte dans formulaires
- [ ] ✅ Connexion lente/interrompue

**Résultat** : ___ / 7 tests

---

## 📊 RÉSUMÉ DES TESTS

### Total des tests : ~220+

| Catégorie | Tests | Réussis | Échecs | Notes |
|-----------|-------|---------|--------|-------|
| Authentification | 29 | ___ | ___ | |
| Navigation | 24 | ___ | ___ | |
| Gestion Contenu | 37 | ___ | ___ | |
| Lecteur Vidéo | 29 | ___ | ___ | |
| Fonctionnalités User | 30 | ___ | ___ | |
| Panel Admin | 66 | ___ | ___ | |
| Responsive | 18 | ___ | ___ | |
| Sécurité/Performance | 15 | ___ | ___ | |
| PWA | 9 | ___ | ___ | |
| Erreurs/Edge Cases | 14 | ___ | ___ | |

**Score global** : ___ / ~220 tests (___%)

---

## 🔴 PROBLÈMES DÉTECTÉS

### Critiques (bloquants)
1. 
2. 
3. 

### Importants (à corriger)
1. 
2. 
3. 

### Mineurs (améliorations)
1. 
2. 
ux)

---

## ✅ VALIDATION FINALE

- [ ] Tous les tests critiques passent
- [ ] Aucun problème bloquant
- [ ] Performance acceptable
- [ ] Sécurité validée
- [ ] Responsive validé
- [ ] Compatibilité navigateurs validée

**Statut** : ⏳ En cours / ✅ Validé / ❌ Rejeté

---

**Date du test** : _____  
**Testeur** : _____  
**Version testée** : _____

---

## 📝 NOTES ADDITIONNELLES

(Pour noter les observations, bugs, suggestions, etc.)

---

