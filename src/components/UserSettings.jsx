import { useState, useEffect } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { useLanguage } from '../contexts/LanguageContext'
import { settingsAPI, photosAPI } from '../api'

export default function UserSettings() {
  const { t, language, changeLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    language: language,
    rootFolder: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [syncMessage, setSyncMessage] = useState(null)

  useEffect(() => {
    // Load user info from database
    const loadSettings = async () => {
      try {
        const [firstName, lastName, rootFolder] = await Promise.all([
          settingsAPI.getFirstName(),
          settingsAPI.getLastName(),
          photosAPI.getRootFolder()
        ])

        setFormData({
          firstName: firstName || '',
          lastName: lastName || '',
          language: language,
          rootFolder: rootFolder || ''
        })
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }

    loadSettings()
  }, [language])

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

    setIsSaving(true)

    try {
      // Save all settings to database
      await settingsAPI.setFirstName(formData.firstName)
      await settingsAPI.setLastName(formData.lastName)
      await settingsAPI.setLanguage(formData.language)

      // Save root folder if changed (this will trigger folder scanning)
      if (formData.rootFolder) {
        await photosAPI.setRootFolder(formData.rootFolder)
      }

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('userInfoUpdated'))

      // Change language if different
      if (formData.language !== language) {
        changeLanguage(formData.language)
      }

      setTimeout(() => {
        setIsSaving(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      }, 500)
    } catch (error) {
      console.error('Error saving settings:', error)
      setIsSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Change language immediately when selected
    if (field === 'language') {
      changeLanguage(value)
    }
  }

  const handleSyncDatabase = async () => {
    try {
      setScanning(true)
      setSyncMessage(null)
      const result = await photosAPI.syncDatabase()

      const messages = []
      if (result.photos_removed > 0) {
        messages.push(`${result.photos_removed} ${t('ui.photosRemoved')}`)
      }
      if (result.photos_updated > 0) {
        messages.push(`${result.photos_updated} ${t('ui.photosUpdated')}`)
      }
      if (result.folders_cleaned > 0) {
        messages.push(`${result.folders_cleaned} ${t('ui.foldersRemoved')}`)
      }

      if (messages.length > 0) {
        setSyncMessage(messages.join(', '))
      } else {
        setSyncMessage(t('ui.noChanges'))
      }

      if (result.errors && result.errors.length > 0) {
        console.error('Sync errors:', result.errors)
      }

      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000)
    } catch (err) {
      console.error('Error syncing database:', err)
      setSyncMessage(t('photoManager.syncError'))
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {t('user.personalInfo')}
        </h3>

        <form onSubmit={handleSubmit}>
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
                {t('ui.rootFolder')}
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
                {t('user.rootFolderDescription')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? t('common.loading') : t('common.save')}
            </button>

            {showSuccess && (
              <span className="text-green-600 text-sm font-medium">
                ✓ {t('common.saved')}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Database Synchronization Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {t('ui.syncDatabase')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('ui.syncDatabaseDescription')}
        </p>

        <button
          onClick={handleSyncDatabase}
          disabled={scanning}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {scanning ? t('common.loading') : t('ui.syncDatabase')}
        </button>

        {syncMessage && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm">
            {syncMessage}
          </div>
        )}
      </div>
    </div>
  )
}
