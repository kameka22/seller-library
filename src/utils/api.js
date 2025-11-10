import { invoke } from '@tauri-apps/api/tauri'

// ========== OBJECTS API ==========

export const objectsAPI = {
  // Lister tous les objets
  list: async () => {
    return await invoke('list_objects')
  },

  // Récupérer un objet par ID
  get: async (id) => {
    return await invoke('get_object', { id })
  },

  // Créer un nouvel objet
  create: async (object) => {
    return await invoke('create_object', { object })
  },

  // Modifier un objet
  update: async (id, object) => {
    return await invoke('update_object', { id, object })
  },

  // Supprimer un objet
  delete: async (id) => {
    return await invoke('delete_object', { id })
  },
}

// ========== PHOTOS API ==========

export const photosAPI = {
  // Lister toutes les photos
  list: async () => {
    return await invoke('list_photos')
  },

  // Scanner un répertoire
  scanDirectory: async (sourcePath) => {
    return await invoke('scan_photos', { request: { source_path: sourcePath } })
  },

  // Supprimer une photo (fichier + DB)
  delete: async (photoId) => {
    return await invoke('delete_photo', { photoId })
  },

  // Supprimer une photo (DB uniquement)
  deleteDbOnly: async (photoId) => {
    return await invoke('delete_photo_db_only', { photoId })
  },

  // Supprimer un dossier entier de manière récursive (fichiers + DB)
  deleteFolder: async (folderPath) => {
    return await invoke('delete_folder_recursive', { request: { folder_path: folderPath } })
  },

  // Supprimer un dossier entier de manière récursive (DB uniquement)
  deleteFolderDbOnly: async (folderPath) => {
    return await invoke('delete_folder_recursive_db_only', { request: { folder_path: folderPath } })
  },

  // Récupérer les photos d'un objet
  getForObject: async (objectId) => {
    return await invoke('get_object_photos', { objectId })
  },

  // Associer une photo à un objet
  associateToObject: async (photoId, objectId) => {
    return await invoke('associate_photo', { objectId, request: { photo_id: photoId } })
  },

  // Dissocier une photo
  dissociate: async (id) => {
    return await invoke('dissociate_photo', { id })
  },

  // Sauvegarder une photo éditée
  saveEdited: async (photoId, base64Data, createCopy = false) => {
    return await invoke('save_edited_photo', { photoId, request: { base64_data: base64Data, create_copy: createCopy } })
  },

  // Déplacer des photos et dossiers vers un nouveau répertoire
  moveItems: async (photoIds, folderPaths, destinationPath) => {
    return await invoke('move_photos_and_folders', {
      request: {
        photo_ids: photoIds,
        folder_paths: folderPaths,
        destination_path: destinationPath
      }
    })
  },

  // Créer un nouveau dossier
  createFolder: async (folderPath) => {
    return await invoke('create_folder', {
      request: {
        folder_path: folderPath
      }
    })
  },
}

// ========== PLATFORMS API ==========

export const platformsAPI = {
  // Lister les plateformes
  list: async () => {
    return await invoke('list_platforms')
  },

  // Récupérer les plateformes d'un objet
  getForObject: async (objectId) => {
    return await invoke('get_object_platforms', { objectId })
  },

  // Ajouter un objet à une plateforme
  add: async (objectId, request) => {
    return await invoke('add_object_to_platform', { objectId, request })
  },

  // Retirer un objet d'une plateforme
  remove: async (id) => {
    return await invoke('remove_object_from_platform', { id })
  },
}
