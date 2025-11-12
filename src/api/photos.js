import { invoke } from '@tauri-apps/api/tauri'

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
  associateToObject: async (photoId, objectId, displayOrder = null) => {
    const request = { photo_id: photoId }
    if (displayOrder !== null) {
      request.display_order = displayOrder
    }
    return await invoke('associate_photo', { objectId, request })
  },

  // Dissocier une photo
  dissociate: async (id) => {
    return await invoke('dissociate_photo', { id })
  },

  // Définir une photo comme principale pour un objet (display_order=0)
  setMainForObject: async (objectId, photoId) => {
    return await invoke('set_main_photo_for_object', { objectId, photoId })
  },

  // Sauvegarder une photo éditée
  saveEdited: async (photoId, base64Data, createCopy = false) => {
    return await invoke('save_edited_photo', { photoId, request: { base64_data: base64Data, create_copy: createCopy } })
  },

  // Déplacer des photos, fichiers texte et dossiers vers un nouveau répertoire
  moveItems: async (photoIds, textFileIds, folderPaths, destinationPath, deleteSourceFolder = false) => {
    return await invoke('move_photos_and_folders', {
      request: {
        photo_ids: photoIds,
        text_file_ids: textFileIds,
        folder_paths: folderPaths,
        destination_path: destinationPath,
        delete_source_folder: deleteSourceFolder
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
