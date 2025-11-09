import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function UserSettings() {
  const { t, language, changeLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    language: language
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Load user info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    setFormData({
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || '',
      language: language
    })
  }, [language])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return
    }

    setIsSaving(true)

    // Save user info to localStorage
    localStorage.setItem('userInfo', JSON.stringify({
      firstName: formData.firstName,
      lastName: formData.lastName
    }))

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
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Change language immediately when selected
    if (field === 'language') {
      changeLanguage(value)
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
    </div>
  )
}
