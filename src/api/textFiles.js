import { invoke } from '@tauri-apps/api/tauri'

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

  // Créer un fichier texte
  createDescriptionFile: async (folderPath) => {
    return await invoke('create_description_file', {
      request: { folder_path: folderPath }
    })
  },
}
