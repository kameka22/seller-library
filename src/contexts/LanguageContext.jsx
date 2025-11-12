import { createContext, useContext, useState, useEffect } from 'react'
import { settingsAPI } from '../api'
import en from '../locales/en.json'
import fr from '../locales/fr.json'

const translations = {
  en,
  fr
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Use localStorage as initial cache
    return localStorage.getItem('language') || 'en'
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load language from settings database
    const loadLanguage = async () => {
      try {
        const savedLanguage = await settingsAPI.getLanguage()
        if (savedLanguage && translations[savedLanguage]) {
          setLanguage(savedLanguage)
          localStorage.setItem('language', savedLanguage)
        } else {
          // If no language in settings, use localStorage or default
          const localLang = localStorage.getItem('language') || 'en'
          setLanguage(localLang)
        }
      } catch (error) {
        console.error('Error loading language from settings:', error)
        // Fallback to localStorage
        const localLang = localStorage.getItem('language') || 'en'
        setLanguage(localLang)
      } finally {
        setIsLoaded(true)
      }
    }

    loadLanguage()
  }, [])

  // Save to both localStorage and settings when language changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('language', language)
      // Save to settings database asynchronously
      settingsAPI.setLanguage(language).catch(err => {
        console.error('Error saving language to settings:', err)
      })
    }
  }, [language, isLoaded])

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }

    if (typeof value === 'string') {
      // Replace parameters like {{current}} with actual values
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match
      })
    }

    return key
  }

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
