import { useState } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { useLanguage } from '../contexts/LanguageContext'
import { settingsAPI, photosAPI } from '../api'

export default function WelcomeModal({ onComplete }) {
  const { t, changeLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    language: 'fr',
    rootFolder: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectRootFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('photoManager.selectRootFolder')
      })

      if (selected) {
        setFormData(prev => ({ ...prev, rootFolder: selected }))
      }
    } catch (err) {
      console.error('Error selecting root folder:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Save all settings to database
      await settingsAPI.setFirstName(formData.firstName)
      await settingsAPI.setLastName(formData.lastName)
      await settingsAPI.setLanguage(formData.language)

      // Save root folder if selected (this will trigger folder scanning)
      if (formData.rootFolder) {
        await photosAPI.setRootFolder(formData.rootFolder)
      }

      // Mark welcome as completed in database
      await settingsAPI.set('welcome_completed', 'true')

      // Change language in context
      changeLanguage(formData.language)

      onComplete()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(t('photoManager.rootFolderError'))
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Change language immediately when selected
    if (field === 'language') {
      changeLanguage(value)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            {t('welcome.title')}
          </h2>
          <p className="text-gray-600 text-center mt-2">
            {t('welcome.message')}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="space-y-4">
            {/* Language - First */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('welcome.language')}
              </label>
              <div className="relative">
                <select
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-gray-700 font-medium shadow-sm hover:border-gray-400 transition-colors"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                  autoFocus
                >
                  <option value="en">{t('welcome.english')}</option>
                  <option value="fr">{t('welcome.french')}</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('welcome.firstName')} *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('welcome.lastName')} *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Root Folder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ui.rootFolder')} ({t('common.optional')})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.rootFolder}
                  readOnly
                  placeholder={t('photoManager.selectRootFolder')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <button
                  type="button"
                  onClick={handleSelectRootFolder}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {t('common.browse')}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {t('welcome.rootFolderHint')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? t('common.loading') : t('common.validate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
