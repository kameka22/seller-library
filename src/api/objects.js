import { invoke } from '@tauri-apps/api/tauri'

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
