import { useState, useEffect } from 'react'
import { textFilesAPI } from '../utils/api'
import { useLanguage } from '../contexts/LanguageContext'

export default function TextFileEdit({ textFile, onClose, onSaved }) {
  const { t } = useLanguage()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadContent()
  }, [textFile.id])

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)
      const fileContent = await textFilesAPI.getContent(textFile.id)
      setContent(fileContent)
      setOriginalContent(fileContent)
    } catch (err) {
      console.error('Error loading text file content:', err)
      setError(t('errors.loadingFile'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      await textFilesAPI.saveContent(textFile.id, content)
      setOriginalContent(content)
      if (onSaved) {
        onSaved()
      }
      onClose()
    } catch (err) {
      console.error('Error saving text file:', err)
      setError(t('errors.savingFile'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Check if there are unsaved changes
    if (content !== originalContent) {
      if (!window.confirm(t('ui.unsavedChanges'))) {
        return
      }
    }
    onClose()
  }

  const hasChanges = content !== originalContent

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('ui.editFile')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{textFile.file_name}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  {error}
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[500px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                placeholder={t('ui.enterTextContent')}
              />
              <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
                <span>
                  {content.length} {t('ui.characters')}
                  {hasChanges && (
                    <span className="ml-2 text-orange-600 font-medium">
                      • {t('ui.unsavedChanges')}
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {t('ui.lastModified')}: {new Date(textFile.updated_at).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('ui.saving')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('common.save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
