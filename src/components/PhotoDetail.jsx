import { useState } from 'react'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { photosAPI } from '../utils/api'
import PhotoEditor from './PhotoEditor'
import { useLanguage } from '../contexts/LanguageContext'

export default function PhotoDetail({ photo, onClose, onPhotoUpdated, initialEditMode = false }) {
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(initialEditMode)
  const [imageKey, setImageKey] = useState(Date.now())

  if (!photo) return null

  // Add cache buster to force reload when image is updated
  const imageSrc = `${convertFileSrc(photo.file_path)}?t=${imageKey}`
  const fileSizeKB = photo.file_size ? (photo.file_size / 1024).toFixed(2) : 'N/A'

  const handleSaveEdited = async (photoId, base64Data, createCopy) => {
    try {
      const updatedPhoto = await photosAPI.saveEdited(photoId, base64Data, createCopy)
      setIsEditing(false)
      // Force image reload by updating cache buster
      setImageKey(Date.now())
      if (onPhotoUpdated) {
        onPhotoUpdated(updatedPhoto)
      }
    } catch (err) {
      console.error('Error saving edited photo:', err)
      alert(t('ui.savingError'))
    }
  }

  if (isEditing) {
    return (
      <PhotoEditor
        photo={photo}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveEdited}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 truncate">
                {photo.file_name}
              </h2>
              <p className="text-sm text-gray-500 truncate mt-1" title={photo.file_path}>
                {photo.file_path}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* Image Preview */}
          <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={imageSrc}
              alt={photo.file_name}
              className="w-full h-auto max-h-96 object-contain"
              onError={(e) => {
                e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23ddd" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">${t('ui.loadingError')}</text></svg>`
              }}
            />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t('ui.dimensions')}</h3>
              <p className="text-gray-900">
                {photo.width && photo.height
                  ? `${photo.width} × ${photo.height} px`
                  : 'N/A'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t('ui.size')}</h3>
              <p className="text-gray-900">{fileSizeKB} KB</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t('ui.originalPath')}</h3>
              <p className="text-gray-900 text-sm truncate" title={photo.original_path}>
                {photo.original_path}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t('ui.importedOn')}</h3>
              <p className="text-gray-900">
                {new Date(photo.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('common.edit')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
