import { useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { useLanguage } from '../contexts/LanguageContext'

export default function UpdateModal({ updateInfo, onClose, onCheckUpdate, isChecking }) {
  const { t } = useLanguage()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await invoke('download_and_install_update', {
        downloadUrl: updateInfo.download_url,
      })
      // Application will close and restart automatically
    } catch (error) {
      console.error('Update failed:', error)
      alert(t('ui.updateFailed') + ' ' + error)
      setIsUpdating(false)
    }
  }

  const changesList = updateInfo ? updateInfo.notes.split('\n').filter(line => line.trim()) : []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('update.title')}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {isChecking ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                {/* Spinner */}
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 text-center">
                {t('update.checking')}
              </p>
            </div>
          ) : isUpdating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                {/* Spinner */}
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 text-center">
                {t('update.downloading')}
              </p>
              <p className="mt-2 text-sm text-gray-500 text-center">
                {t('update.willRestart')}
              </p>
            </div>
          ) : updateInfo ? (
            <>
              <div className="mb-4">
                <p className="text-gray-700">
                  {t('update.updatePrompt', {
                    current: updateInfo.current_version,
                    new: updateInfo.version
                  })}
                </p>
              </div>

              {changesList.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">{t('update.changes')}</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {changesList.map((change, index) => (
                      <li key={index}>{change.replace(/^-\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-600 font-semibold text-center">
                {t('update.upToDate')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isUpdating && !isChecking && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            {updateInfo ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {t('common.no')}
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {t('common.yes')}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t('common.close')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
