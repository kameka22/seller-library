import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function WelcomeModal({ onComplete }) {
  const { t, changeLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    language: 'en'
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return
    }

    // Save user info to localStorage
    localStorage.setItem('userInfo', JSON.stringify({
      firstName: formData.firstName,
      lastName: formData.lastName
    }))

    // Change language
    changeLanguage(formData.language)

    // Mark welcome as completed
    localStorage.setItem('welcomeCompleted', 'true')

    onComplete()
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
          </div>

          {/* Footer */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              {t('common.validate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
