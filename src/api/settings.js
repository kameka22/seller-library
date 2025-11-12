import { invoke } from '@tauri-apps/api/tauri'

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
