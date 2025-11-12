import { invoke } from '@tauri-apps/api/tauri'

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
