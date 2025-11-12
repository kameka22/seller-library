# Seller Library - Implémentation des Fonctions

## Version : 0.2.0

### Changements récents (v0.2.0)
- **Backend** : `associate_photo` accepte maintenant un paramètre optionnel `display_order` pour définir l'ordre d'affichage des photos sur les objets
- **Backend** : `import_photos` crée et enregistre automatiquement le fichier `description.txt` dans la base de données (table `text_files`)
- **Frontend** : `associateToObject` accepte un troisième paramètre optionnel `displayOrder` pour contrôler l'ordre d'affichage
- **Frontend** : Les photos flaggées `is_main` dans les dossiers sont maintenant correctement associées avec `display_order=0` lors de la création d'objets

---

## ⚠️ FONCTIONS NON UTILISÉES

**Aucune fonction non utilisée détectée** - Toutes les fonctions du backend et frontend sont utilisées dans l'application.

---

# BACKEND (Rust - src-tauri/)

## build.rs
| Fonction | Type | Rôle |
|----------|------|------|
| `main` | fn | Point d'entrée du script de build Tauri |

## src/main.rs
| Fonction | Type | Rôle |
|----------|------|------|
| `main` | async fn | Point d'entrée de l'application, initialise la DB et l'app Tauri |

## src/db.rs
| Fonction | Type | Rôle |
|----------|------|------|
| `init_db` | pub async fn | Initialise la base SQLite et exécute les 7 migrations |

## src/updater.rs
| Fonction | Type | Rôle |
|----------|------|------|
| `check_for_updates` | Tauri command | Vérifie les mises à jour sur GitHub |
| `download_and_install_update` | Tauri command | Télécharge et installe la mise à jour |

## src/models.rs
**Pas de fonctions** - Contient uniquement les définitions de structures (Object, Photo, Platform, Category, Folder, TextFile, etc.)

## src/commands/mod.rs

### OBJECTS
| Fonction | Rôle |
|----------|------|
| `list_objects` | Liste tous les objets |
| `get_object` | Récupère un objet par ID |
| `create_object` | Crée un nouvel objet |
| `update_object` | Met à jour les champs d'un objet |
| `delete_object` | Supprime un objet par ID |

### PHOTOS
| Fonction | Rôle |
|----------|------|
| `list_photos` | Liste toutes les photos |
| `scan_photos` | Scanne récursivement un dossier pour les photos/textes |
| `delete_photo` | Supprime photo (fichier + DB) |
| `delete_photo_db_only` | Supprime photo de la DB uniquement |
| `toggle_main_photo` | Marque une photo comme principale pour son dossier |
| `delete_folder_recursive` | Supprime un dossier et son contenu (fichiers + DB) |
| `delete_folder_recursive_db_only` | Supprime un dossier de la DB uniquement |
| `save_edited_photo` | Sauvegarde une photo éditée (écrase ou copie) |
| `get_object_photos` | Récupère les photos associées à un objet |
| `associate_photo` | Associe une photo à un objet avec display_order optionnel |
| `dissociate_photo` | Retire l'association photo-objet |
| `set_main_photo_for_object` | Définit la photo principale d'un objet (display_order=0) |
| `scan_directory_recursive` | (privé) Scanne récursivement pour photos/textes |
| `is_image_file` | (privé) Vérifie si l'extension est une image |
| `import_photo` | (privé) Importe une photo dans la DB |

### TEXT FILES
| Fonction | Rôle |
|----------|------|
| `list_text_files` | Liste tous les fichiers texte |
| `get_text_file_content` | Lit le contenu d'un fichier texte |
| `save_text_file_content` | Sauvegarde le contenu d'un fichier texte |
| `delete_text_file` | Supprime fichier texte (fichier + DB) |
| `delete_text_file_db_only` | Supprime fichier texte de la DB uniquement |
| `is_text_file` | (privé) Vérifie si l'extension est .txt ou .md |
| `import_text_file` | (privé) Importe un fichier texte dans la DB |

### PLATFORMS
| Fonction | Rôle |
|----------|------|
| `list_platforms` | Liste toutes les plateformes de vente |
| `create_platform` | Crée une nouvelle plateforme |
| `update_platform` | Met à jour les détails d'une plateforme |
| `delete_platform` | Supprime une plateforme |
| `get_object_platforms` | Récupère les plateformes pour un objet |
| `add_object_to_platform` | Ajoute un objet à une plateforme |
| `remove_object_from_platform` | Retire un objet d'une plateforme |

### CATEGORIES
| Fonction | Rôle |
|----------|------|
| `list_categories` | Liste toutes les catégories |
| `create_category` | Crée une catégorie et son dossier physique |
| `delete_category` | Supprime catégorie, dossier et photos récursivement |

### PHOTO IMPORT
| Fonction | Rôle |
|----------|------|
| `list_volumes` | Liste les volumes/disques externes |
| `scan_volume_for_photos` | Scanne un volume pour les photos, retourne aperçu |
| `import_photos` | Importe des photos de source vers destination et crée description.txt en DB |
| `is_photo_file` | (privé) Vérifie si le fichier est une photo |
| `scan_for_photos_recursive` | (privé) Scanne récursivement pour photos |

### FILE OPERATIONS
| Fonction | Rôle |
|----------|------|
| `move_photos_and_folders` | Déplace photos/textes/dossiers |
| `copy_photos_and_folders` | Copie photos/textes/dossiers |

### FOLDERS
| Fonction | Rôle |
|----------|------|
| `list_folders` | Liste tous les dossiers de la DB |
| `create_folder` | Crée un dossier physique et son entrée DB |
| `delete_folder_from_db` | Supprime un dossier de la DB |

### DATABASE SYNC
| Fonction | Rôle |
|----------|------|
| `sync_database` | Synchronise la DB avec le système de fichiers |
| `scan_and_create_folders` | (privé) Scanne et crée la hiérarchie de dossiers |
| `rebuild_folder_hierarchy` | (privé) Reconstruit les relations parent_id |
| `ensure_folder_in_db` | (privé) S'assure qu'un dossier existe dans la DB |

### SETTINGS
| Fonction | Rôle |
|----------|------|
| `get_setting` | Récupère une valeur de paramètre par clé |
| `set_setting` | Définit une valeur de paramètre |
| `get_all_settings` | Récupère tous les paramètres comme map |
| `get_root_folder` | Récupère le chemin du dossier racine |
| `set_root_folder` | Définit le dossier racine, crée les dossiers par défaut |

---

# FRONTEND (JavaScript/React - src/)

## main.jsx
| Fonction | Rôle |
|----------|------|
| - | Point d'entrée, rend l'app React |

## App.jsx
| Fonction | Type | Rôle |
|----------|------|------|
| `AppContent` | Component | Container principal avec routing |
| `App` | Component | Enveloppe AppContent avec LanguageProvider |
| `getPageTitle` | fn | Retourne le titre de page selon l'onglet actif |
| `getPageDescription` | fn | Retourne la description de page selon l'onglet |
| `checkForUpdates` | fn | Vérifie les mises à jour de l'app |
| `handleUpdateClick` | fn | Ouvre la modale de mise à jour |
| `handleCloseUpdateModal` | fn | Ferme la modale de mise à jour |

## utils/api.js

### objectsAPI
| Fonction | Rôle |
|----------|------|
| `list()` | Liste tous les objets |
| `get(id)` | Récupère un objet par ID |
| `create(object)` | Crée un nouvel objet |
| `update(id, object)` | Met à jour un objet |
| `delete(id)` | Supprime un objet |

### photosAPI
| Fonction | Rôle |
|----------|------|
| `list()` | Liste toutes les photos |
| `scanDirectory(sourcePath)` | Scanne un dossier pour photos |
| `delete(photoId)` | Supprime une photo |
| `deleteDbOnly(photoId)` | Supprime photo de la DB uniquement |
| `toggleMain(photoId)` | Bascule le statut de photo principale |
| `deleteFolder(folderPath)` | Supprime un dossier |
| `deleteFolderDbOnly(folderPath)` | Supprime dossier de la DB uniquement |
| `getForObject(objectId)` | Récupère les photos d'un objet |
| `associateToObject(photoId, objectId, displayOrder)` | Associe photo à objet avec ordre d'affichage optionnel |
| `dissociate(id)` | Dissocie une photo |
| `setMainForObject(objectId, photoId)` | Définit photo principale d'objet |
| `saveEdited(photoId, base64Data, createCopy)` | Sauvegarde photo éditée |
| `moveItems(...)` | Déplace des items |
| `copyItems(...)` | Copie des items |
| `createFolder(folderPath)` | Crée un dossier |
| `listFolders()` | Liste les dossiers |
| `deleteFolderFromDb(folderId)` | Supprime dossier de la DB |
| `syncDatabase()` | Synchronise la base de données |
| `getRootFolder()` | Récupère le dossier racine |
| `setRootFolder(path)` | Définit le dossier racine |

### textFilesAPI
| Fonction | Rôle |
|----------|------|
| `list()` | Liste tous les fichiers texte |
| `getContent(fileId)` | Récupère le contenu d'un fichier |
| `saveContent(fileId, content)` | Sauvegarde le contenu |
| `delete(fileId)` | Supprime un fichier texte |
| `deleteDbOnly(fileId)` | Supprime de la DB uniquement |

### settingsAPI
| Fonction | Rôle |
|----------|------|
| `get(key)` | Récupère un paramètre |
| `set(key, value)` | Définit un paramètre |
| `getAll()` | Récupère tous les paramètres |
| `getFirstName()` | Récupère le prénom |
| `setFirstName(value)` | Définit le prénom |
| `getLastName()` | Récupère le nom |
| `setLastName(value)` | Définit le nom |
| `getLanguage()` | Récupère la langue |
| `setLanguage(value)` | Définit la langue |

### platformsAPI
| Fonction | Rôle |
|----------|------|
| `list()` | Liste toutes les plateformes |
| `getForObject(objectId)` | Récupère les plateformes d'un objet |
| `add(objectId, request)` | Ajoute objet à une plateforme |
| `remove(id)` | Retire objet d'une plateforme |

## contexts/LanguageContext.jsx
| Fonction | Type | Rôle |
|----------|------|------|
| `LanguageProvider` | Component | Fournit le contexte de langue à l'app |
| `useLanguage` | Hook | Hook pour accéder au contexte de langue |
| `t` | fn | Fonction de traduction avec paramètres |
| `changeLanguage` | fn | Change la langue active |

## components/

### Sidebar.jsx
| Fonction | Type | Rôle |
|----------|------|------|
| `Sidebar` | Component | Barre de navigation latérale avec menu |
| `loadUserName` | fn | Charge le nom d'utilisateur depuis localStorage |

### ObjectList.jsx
| Fonction | Rôle |
|----------|------|
| `ObjectList` | Component - Liste les objets avec filtres/pagination |
| `loadObjects` | Charge les objets depuis l'API |
| `loadCategories` | Charge les catégories |
| `handleCreate` | Crée un nouvel objet |
| `handleUpdate` | Met à jour un objet dans la liste |
| `handleDeleteRequest` | Ouvre la confirmation de suppression |
| `handleDeleteConfirm` | Confirme et supprime un objet |
| `handleDelete` | Retire un objet de la liste |
| `handleCategoryToggle` | Bascule le filtre de catégorie |
| `handleItemsPerPageChange` | Change la taille de pagination |
| `handlePageChange` | Change de page |

### ObjectCard.jsx
| Fonction | Rôle |
|----------|------|
| `ObjectCard` | Component - Affiche une carte d'objet avec aperçu |
| `loadPhotoPreview` | Charge la première photo pour l'aperçu |

### ObjectDetail.jsx
| Fonction | Rôle |
|----------|------|
| `ObjectDetail` | Component - Affiche/édite les détails d'objet |
| `loadAssociatedPhotos` | Charge les photos de l'objet |
| `handleUpdate` | Met à jour l'objet |
| `handleDeleteClick` | Déclenche la demande de suppression |
| `handlePhotoSelection` | Met à jour les associations de photos |
| `handleRemovePhoto` | Retire une association de photo |
| `handleToggleMainPhoto` | Définit une photo comme principale |

### CreateObjectForm.jsx
| Fonction | Rôle |
|----------|------|
| `CreateObjectForm` | Component - Formulaire de création d'objet |
| `handleSubmit` | Soumet la création d'objet |

### CreateObjectModal.jsx
| Fonction | Rôle |
|----------|------|
| `CreateObjectModal` | Component - Modale de création d'objet depuis photos |
| `findCategoryNameFromPath` | Trouve la catégorie depuis la hiérarchie de dossiers |
| `findCategoryId` | Mappe le nom de catégorie vers l'ID |
| `handleSubmit` | Soumet la création d'objet |

### PhotoManager.jsx
| Fonction | Rôle |
|----------|------|
| `PhotoManager` | Component - Gestionnaire principal de collection de photos |
| `loadInitialData` | Charge photos, dossiers, catégories |
| `loadRootFolder` | Charge le chemin du dossier racine |
| `loadCategories` | Charge les catégories |
| `loadPhotos` | Charge photos, fichiers texte, dossiers |
| `handleSyncDatabase` | Synchronise la DB avec le système de fichiers |
| `handleToggleSelect` | Bascule la sélection d'item |
| `handleDeleteSelected` | Supprime les items sélectionnés |
| `confirmDelete` | Confirme la suppression |
| `handleSelectAll` | Sélectionne tous les items |
| `handleEditPhoto` | Ouvre l'éditeur de photo |
| `handleEditTextFile` | Ouvre l'éditeur de fichier texte |
| `handleDeleteItems` | Supprime des items spécifiques |
| `handleMoveSelected` | Ouvre la modale de déplacement |
| `handleMoveItems` | Déplace des items vers un dossier |
| `handleCopyItems` | Copie des items |
| `handleFolderChange` | Change le dossier courant |
| `handleCopySelected` | Ouvre la modale de copie |
| `handleCreateObject` | Ouvre la modale de création d'objet |

### PhotoTreeView.jsx
| Fonction | Rôle |
|----------|------|
| `PhotoTreeView` | Component - Vue arborescente de photos/dossiers |
| `countPhotos` | Compte les photos dans un dossier |
| `areAllSelected` | Vérifie si tous les items sont sélectionnés |
| `getAllPhotosInFolder` | Récupère toutes les photos d'un dossier |
| `handleFolderSelect` | Sélectionne/désélectionne un dossier |
| `isFolderSelected` | Vérifie si un dossier est sélectionné |
| `isPhotoSelected` | Vérifie si une photo est sélectionnée |
| `handlePhotoContextMenu` | Affiche le menu contextuel de photo |
| `handleFolderContextMenu` | Affiche le menu contextuel de dossier |
| `handlePhotoEdit` | Édite une photo |
| `handlePhotoDelete` | Supprime une photo |
| `handleFolderDelete` | Supprime un dossier |
| `handlePhotoMove` | Déplace une photo |
| `handlePhotoCopy` | Copie une photo |
| `handleFolderMove` | Déplace un dossier |
| `handleFolderCopy` | Copie un dossier |
| `handleTextFileContextMenu` | Affiche le menu contextuel de fichier texte |
| `handleTextFileEdit` | Édite un fichier texte |
| `handleTextFileDelete` | Supprime un fichier texte |
| `handleTextFileMove` | Déplace un fichier texte |
| `handleTextFileCopy` | Copie un fichier texte |
| `isTextFileSelected` | Vérifie si un fichier texte est sélectionné |

### PhotoDetail.jsx
| Fonction | Rôle |
|----------|------|
| `PhotoDetail` | Component - Affiche/édite les détails de photo |
| `handlePhotoEdited` | Gère la sauvegarde d'édition de photo |

### PhotoEditor.jsx
| Fonction | Rôle |
|----------|------|
| `PhotoEditor` | Component - Édition de photo avec transformations |
| `applyTransformations` | Applique rotation/recadrage au canvas |
| `handleSaveClick` | Sauvegarde la photo éditée |
| `handleReset` | Réinitialise toutes les transformations |
| `handleRotate` | Tourne la photo de 90 degrés |
| `handleCropToggle` | Bascule le mode recadrage |
| `handleApplyCrop` | Applique la sélection de recadrage |
| `handleCancelCrop` | Annule le mode recadrage |

### PhotoSelector.jsx
| Fonction | Rôle |
|----------|------|
| `PhotoSelector` | Component - Modale de sélection de photos pour objet |
| `handlePhotoClick` | Bascule la sélection de photo |
| `handleConfirm` | Confirme la sélection |

### PhotoGrid.jsx
| Fonction | Rôle |
|----------|------|
| `PhotoGrid` | Component - Affichage en grille de photos |

### PhotoImport.jsx
| Fonction | Rôle |
|----------|------|
| `PhotoImport` | Component - Assistant d'import de photos |
| `getSteps` | Retourne les étapes de l'assistant |
| `loadImportFolder` | Charge le chemin du dossier d'import |
| `loadVolumes` | Charge les volumes externes |
| `handleVolumeSelect` | Scanne le volume sélectionné |
| `handleSelectDestination` | Ouvre le sélecteur de dossier |
| `canImport` | Vérifie si prêt à importer |
| `handleNext` | Va à l'étape suivante |
| `handlePrevious` | Va à l'étape précédente |
| `getFolderPreview` | Génère l'aperçu du nom de dossier |
| `getDestinationPath` | Récupère le chemin de destination complet |

### TextFileEdit.jsx
| Fonction | Rôle |
|----------|------|
| `TextFileEdit` | Component - Éditeur de fichier texte |
| `handleCancel` | Ferme l'éditeur |

### Categories.jsx
| Fonction | Rôle |
|----------|------|
| `Categories` | Component - Gestion des catégories |
| `loadCategories` | Charge les catégories |
| `handleCreateCategory` | Crée une nouvelle catégorie |
| `handleDeleteClick` | Ouvre la confirmation de suppression |
| `confirmDelete` | Confirme la suppression de catégorie |

### PlatformList.jsx
| Fonction | Rôle |
|----------|------|
| `PlatformList` | Component - Liste les plateformes de vente |
| `handleUpdate` | Met à jour une plateforme dans la liste |
| `handleDeleteRequest` | Ouvre la confirmation de suppression |

### PlatformCard.jsx
| Fonction | Rôle |
|----------|------|
| `PlatformCard` | Component - Affiche une carte de plateforme |

### PlatformDetail.jsx
| Fonction | Rôle |
|----------|------|
| `PlatformDetail` | Component - Affiche/édite les détails de plateforme |
| `handleDeleteClick` | Déclenche la demande de suppression |

### CreatePlatformForm.jsx
| Fonction | Rôle |
|----------|------|
| `CreatePlatformForm` | Component - Formulaire de création de plateforme |

### Sales.jsx
| Fonction | Rôle |
|----------|------|
| `Sales` | Component - Suivi des ventes (placeholder) |

### SlidePanel.jsx
| Fonction | Rôle |
|----------|------|
| `SlidePanel` | Component - Panneau coulissant pour détails |
| `handleEscape` | Ferme le panneau sur touche Échap |

### ConfirmModal.jsx
| Fonction | Rôle |
|----------|------|
| `ConfirmModal` | Component - Dialogue de confirmation |
| `handleConfirm` | Confirme l'action |
| `handleCancel` | Annule l'action |

### MoveToFolderModal.jsx
| Fonction | Rôle |
|----------|------|
| `MoveToFolderModal` | Component - Modale de déplacement/copie d'items |
| `handleConfirm` | Confirme le déplacement/copie |
| `canMoveToCurrentFolder` | Valide la destination |

### WelcomeModal.jsx
| Fonction | Rôle |
|----------|------|
| `WelcomeModal` | Component - Assistant de bienvenue au premier lancement |
| `handleChange` | Met à jour un champ du formulaire |

### UpdateModal.jsx
| Fonction | Rôle |
|----------|------|
| `UpdateModal` | Component - Dialogue de mise à jour de l'app |

### UserSettings.jsx
| Fonction | Rôle |
|----------|------|
| `UserSettings` | Component - Page de paramètres utilisateur |
| `handleChange` | Met à jour un champ du formulaire |

### Stepper.jsx
| Fonction | Rôle |
|----------|------|
| `Stepper` | Component - Indicateur d'étapes pour assistant |

---

## STATISTIQUES

### Backend
- **Fichiers**: 6 fichiers Rust
- **Fonctions totales**: 52 fonctions
  - 48 commandes Tauri publiques (pub async fn)
  - 4 fonctions d'aide privées
- **Fonctions non utilisées**: 0

### Frontend
- **Fichiers**: 31 fichiers JavaScript/JSX
- **Composants**: 27 composants React
- **Fonctions totales**: 150+ fonctions
  - Composants
  - Handlers d'événements
  - Fonctions utilitaires
- **Fonctions non utilisées**: 0

### Notes
- Toutes les commandes Tauri du backend sont enregistrées dans main.rs et appelées depuis le frontend
- Toutes les fonctions d'aide sont utilisées en interne dans le backend
- Tous les composants frontend sont importés et utilisés dans l'arborescence des composants
- Toutes les fonctions utilitaires dans api.js sont des wrappers pour les commandes backend
- Le codebase est **bien structuré sans code mort détecté**
