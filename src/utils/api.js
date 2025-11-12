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

  // Toggle main photo (mark as main and unmark others in same folder)
  toggleMain: async (photoId) => {
    return await invoke('toggle_main_photo', { photoId })
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

  // Déplacer des photos, fichiers texte et dossiers vers un nouveau répertoire
  moveItems: async (photoIds, textFileIds, folderPaths, destinationPath) => {
    return await invoke('move_photos_and_folders', {
      request: {
        photo_ids: photoIds,
        text_file_ids: textFileIds,
        folder_paths: folderPaths,
        destination_path: destinationPath
      }
    })
  },

  copyItems: async (photoIds, textFileIds, folderPaths, destinationPath) => {
    return await invoke('copy_photos_and_folders', {
      request: {
        photo_ids: photoIds,
        text_file_ids: textFileIds,
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

  // Lister tous les dossiers depuis la base de données
  listFolders: async () => {
    return await invoke('list_folders')
  },

  // Supprimer un dossier de la base de données
  deleteFolderFromDb: async (folderId) => {
    return await invoke('delete_folder_from_db', { folderId })
  },

  // Synchroniser la base de données avec le système de fichiers
  syncDatabase: async () => {
    return await invoke('sync_database')
  },

  // Obtenir le dossier racine de la collection
  getRootFolder: async () => {
    return await invoke('get_root_folder')
  },

  // Définir le dossier racine de la collection
  setRootFolder: async (path) => {
    return await invoke('set_root_folder', { path })
  },
}

// ========== TEXT FILES API ==========

export const textFilesAPI = {
  // Lister tous les fichiers texte
  list: async () => {
    return await invoke('list_text_files')
  },

  // Obtenir le contenu d'un fichier texte
  getContent: async (fileId) => {
    return await invoke('get_text_file_content', { fileId })
  },

  // Sauvegarder le contenu d'un fichier texte
  saveContent: async (fileId, content) => {
    return await invoke('save_text_file_content', { fileId, content })
  },

  // Supprimer un fichier texte (fichier + DB)
  delete: async (fileId) => {
    return await invoke('delete_text_file', { fileId })
  },

  // Supprimer un fichier texte (DB uniquement)
  deleteDbOnly: async (fileId) => {
    return await invoke('delete_text_file_db_only', { fileId })
  },
}

// ========== SETTINGS API ==========

export const settingsAPI = {
  // Obtenir une valeur de paramètre
  get: async (key) => {
    return await invoke('get_setting', { key })
  },

  // Définir une valeur de paramètre
  set: async (key, value) => {
    return await invoke('set_setting', { key, value })
  },

  // Obtenir tous les paramètres
  getAll: async () => {
    return await invoke('get_all_settings')
  },

  // Fonctions pratiques pour les paramètres courants
  getFirstName: async () => {
    return await invoke('get_setting', { key: 'first_name' })
  },

  setFirstName: async (value) => {
    return await invoke('set_setting', { key: 'first_name', value })
  },

  getLastName: async () => {
    return await invoke('get_setting', { key: 'last_name' })
  },

  setLastName: async (value) => {
    return await invoke('set_setting', { key: 'last_name', value })
  },

  getLanguage: async () => {
    return await invoke('get_setting', { key: 'language' })
  },

  setLanguage: async (value) => {
    return await invoke('set_setting', { key: 'language', value })
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
