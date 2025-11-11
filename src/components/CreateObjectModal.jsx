import { useState, useEffect } from 'react'
import { textFilesAPI } from '../utils/api'
import { useLanguage } from '../contexts/LanguageContext'

export default function CreateObjectModal({
  isOpen,
  onClose,
  onConfirm,
  selectedPhotos = [],
  selectedTextFiles = [],
  currentFolderName = '',
  categories = []
}) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    year: '',
    weight: '',
    category_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState(false)

  // Reset and pre-fill form when modal opens
  useEffect(() => {
    const loadTextFileContent = async () => {
      if (isOpen && selectedTextFiles.length > 0) {
        setLoadingDescription(true)
        try {
          const content = await textFilesAPI.getContent(selectedTextFiles[0].id)
          setFormData(prev => ({
            ...prev,
            name: currentFolderName || '',
            description: content || '',
            year: '',
            weight: '',
            category_id: '',
          }))
        } catch (err) {
          console.error('Error loading text file content:', err)
          setFormData({
            name: currentFolderName || '',
            description: '',
            year: '',
            weight: '',
            category_id: '',
          })
        } finally {
          setLoadingDescription(false)
        }
      } else if (isOpen) {
        setFormData({
          name: currentFolderName || '',
          description: '',
          year: '',
          weight: '',
          category_id: '',
        })
      }
    }

    loadTextFileContent()
  }, [isOpen, currentFolderName, selectedTextFiles])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const object = {
      name: formData.name,
      description: formData.description || null,
      year: formData.year ? parseInt(formData.year) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
    }

    await onConfirm(object)
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('objects.createObjectFromPhotos')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6" id="create-object-form">
            {/* Selected Content Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t('objects.selectedContent')}
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{selectedPhotos.length}</span> {selectedPhotos.length > 1 ? t('ui.photosLowercase') : 'photo'}
                </li>
                {selectedTextFiles.length > 0 && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{selectedTextFiles.length}</span> fichier{selectedTextFiles.length > 1 ? 's' : ''} texte
                    {selectedTextFiles.length > 0 && (
                      <span className="text-xs text-gray-500">({selectedTextFiles[0].filename})</span>
                    )}
                  </li>
                )}
              </ul>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.name')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('placeholders.objectName')}
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.description')}
              </label>
              {loadingDescription ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center" style={{ minHeight: '96px' }}>
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">{t('common.loading')}</span>
                  </div>
                </div>
              ) : (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder={t('placeholders.objectDescription')}
                />
              )}
              {selectedTextFiles.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Pré-rempli depuis {selectedTextFiles[0].file_name}
                </p>
              )}
            </div>

            {/* Category Field */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.category')}
                </label>
                <div className="relative">
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-gray-700 font-medium shadow-sm hover:border-gray-400 transition-colors"
                  >
                    <option value="">{t('categories.selectCategory')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Year and Weight Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.year')}
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.objectYear')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.weight')} (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.objectWeight')}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="create-object-form"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('common.loading')}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('common.create')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
