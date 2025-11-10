import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useLanguage } from '../contexts/LanguageContext'

export default function ObjectCard({ object, onClick }) {
  const { t } = useLanguage()
  const [photoCount, setPhotoCount] = useState(0)
  const [firstPhoto, setFirstPhoto] = useState(null)

  useEffect(() => {
    loadPhotoPreview()
  }, [object.id])

  const loadPhotoPreview = async () => {
    try {
      const photos = await invoke('get_object_photos', { objectId: object.id })
      setPhotoCount(photos.length)
      if (photos.length > 0) {
        setFirstPhoto(photos[0])
      }
    } catch (error) {
      console.error('Error loading photo preview:', error)
    }
  }

  return (
    <div
      onClick={() => onClick(object)}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="relative h-48 bg-gray-100">
        {firstPhoto ? (
          <>
            <img
              src={convertFileSrc(firstPhoto.file_path)}
              alt={object.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            {photoCount > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                +{photoCount - 1}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">
            {object.name}
          </h3>
          {photoCount > 0 && (
            <div className="flex items-center gap-1 text-blue-600 text-sm ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">{photoCount}</span>
            </div>
          )}
        </div>

        {object.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {object.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {object.year && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              📅 {object.year}
            </span>
          )}
          {object.weight && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              ⚖️ {object.weight} kg
            </span>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-400">
          {t('ui.createdAt')} {new Date(object.created_at).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  )
}
