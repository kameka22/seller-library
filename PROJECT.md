# Seller Library - Fonctionnalités

Application de bureau (Tauri + React) pour la gestion d'inventaire d'objets à vendre avec organisation de photos et intégration marketplace.

---

## 1. GESTION DES OBJETS

- **CRUD complet** : Créer, lire, modifier, supprimer des objets
- **Champs** : Nom, description, année d'acquisition, poids
- **Catégorisation** : Attribution d'une catégorie par objet
- **Recherche et filtrage** : Par nom, description et catégorie
- **Pagination** : Affichage par lots de 10 objets

---

## 2. GESTION DES PHOTOS

### Organisation
- **Scan de dossiers** : Import de photos depuis volumes externes
- **Structure hiérarchique** : Organisation en dossiers parent-enfant
- **Navigation en arbre** : Vue arborescente avec fil d'Ariane
- **CRUD dossiers** : Créer, supprimer (récursif ou DB seule)

### Édition d'images
- **Éditeur intégré** avec :
  - Luminosité (0-200%)
  - Contraste (0-200%)
  - Zoom/échelle
  - Rotation (90°, 180°, 270°)
  - Recadrage
- **Sauvegarde** : Écraser l'original ou créer une copie

### Association aux objets
- **Lien photo-objet** : Association multiple de photos par objet
- **Photo principale** : Désignation d'une photo principale par objet
- **Ordre d'affichage** : Gestion de l'ordre des photos
- **Flag photo principale par dossier** : Marquage de photo principale par dossier

### Opérations fichiers
- **Déplacer/Copier** : Photos et dossiers entiers
- **Supprimer** : Avec ou sans fichiers physiques
- **Métadonnées** : Suivi taille, dimensions, date de création

---

## 3. IMPORT WIZARD (PHOTOS)

Assistant d'import en 4 étapes :
1. **Sélection appareil** : Liste des volumes, scan et prévisualisation
2. **Choix destination** : Dossier auto ou personnalisé
3. **Description** : Ajout de description pour le lot
4. **Exécution** : Import avec suivi de progression et option de suppression source

---

## 4. GESTION DES FICHIERS TEXTE

- **CRUD complet** : Lire, éditer, sauvegarder, supprimer
- **Association dossiers** : Lié à la structure de dossiers
- **Suppression sélective** : DB seule ou avec fichier physique

---

## 5. CATÉGORIES

- **Créer des catégories** : Pour organiser les objets
- **Lister et supprimer** : Gestion complète
- **Cascade delete** : Suppression propagée aux objets

---

## 6. PLATEFORMES DE VENTE

### Configuration
- **CRUD plateformes** : eBay, Leboncoin, etc.
- **Authentification** : Stockage clés API, secrets, tokens OAuth
- **Environnements** : Production/Sandbox
- **Suivi tokens** : Date d'expiration des access tokens

### Gestion listings
- **Lister objets** : Ajouter objets sur plateformes
- **Retirer objets** : Supprimer des listings
- **URL tracking** : Suivi des URLs de listing
- **Statut** : Brouillon, actif, vendu, etc.

---

## 7. SYNCHRONISATION BASE DE DONNÉES

- **Nettoyage photos manquantes** : Supprime entrées DB sans fichier
- **Mise à jour métadonnées** : Rafraîchit tailles et dimensions
- **Dossiers vides** : Supprime dossiers sans contenu
- **Rapport statistiques** : Nombre d'éléments nettoyés

---

## 8. PARAMÈTRES UTILISATEUR

- **Informations personnelles** : Prénom, nom
- **Sélection langue** : Français/Anglais
- **Dossier racine** : Configuration du répertoire principal
- **Persistence** : Sauvegarde des préférences

---

## 9. MULTI-LANGUE

- **Langues supportées** : Français, Anglais
- **Changement temps réel** : Sans redémarrage
- **Traduction complète** : UI, menus, erreurs, messages

---

## 10. MISES À JOUR AUTOMATIQUES

- **Vérification périodique** : Toutes les 30 minutes
- **Téléchargement et installation** : Automatisé
- **Notifications** : Affichage modal des mises à jour

---

## 11. INTERFACE UTILISATEUR

### Navigation
- **Sidebar** : Navigation principale avec sections
- **Header dynamique** : Titre et description par page
- **Menu contextuel** : Clic-droit sur photos/dossiers/fichiers

### Composants
- **Grilles et listes** : Objets, photos, plateformes
- **Panneaux détails** : Édition complète des objets/plateformes
- **Modales** : Bienvenue, confirmation, création
- **Galerie photos** : Affichage visuel avec arborescence
- **Sélecteurs fichiers** : Dialogs natifs

---

## 12. OPERATIONS FICHIERS AVANCÉES

- **Scan récursif** : Détection automatique des photos
- **Opérations batch** : Traitement multiple
- **Gestion volumes** : Détection des périphériques
- **Création structure** : Hiérarchies de dossiers

---

## ARCHITECTURE TECHNIQUE

### Frontend
- React 18.2 + TypeScript
- Tailwind CSS
- Vite
- React Context (traduction, settings)

### Backend
- Rust + Tauri
- Tokio (async)
- SQLite (~/.seller-library/seller_library.db)
- 7 migrations de schéma

### Tables principales
- objects, photos, object_photos
- platforms, object_platforms
- categories, folders, text_files
- settings (key-value)

### API
**59 commandes Tauri** réparties en :
- Objects (5), Photos (10), Associations (2)
- Text files (5), Platforms (7), Categories (3)
- File ops (6), Folders (3), Settings (5)
- Updates (2), Volumes (2)

---

## CARACTÉRISTIQUES TECHNIQUES

- **Recherche plein texte** : Sur noms et descriptions
- **Indices DB** : Optimisation des requêtes
- **Gestion erreurs** : Messages localisés
- **Transactions sécurisées** : Rollback automatique
- **Relations DB** : Many-to-many, one-to-many, auto-référencement
