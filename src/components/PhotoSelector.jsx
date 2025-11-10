import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useLanguage } from '../contexts/LanguageContext'

export default function PhotoSelector({ isOpen, onClose, onSelect, objectId }) {
  const { t } = useLanguage()
  const [photos, setPhotos] = useState([])
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadPhotos()
      loadAssociatedPhotos()
    }
  }, [isOpen, objectId])

  const loadPhotos = async () => {
    setLoading(true)
    try {
      const allPhotos = await invoke('list_photos')
      setPhotos(allPhotos)

      // Extract unique folders from original_path
      const uniqueFolders = [...new Set(allPhotos.map(p => {
        const parts = p.original_path.split('/')
        parts.pop() // Remove filename
        return parts.join('/')
      }))].sort()

      setFolders(uniqueFolders)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssociatedPhotos = async () => {
    if (!objectId) return

    try {
      const associated = await invoke('get_object_photos', { objectId })
      setSelectedPhotos(associated.map(p => p.id))
    } catch (error) {
      console.error('Error loading associated photos:', error)
    }
  }

  const handlePhotoClick = (photoId) => {
    if (selectedPhotos.includes(photoId)) {
      setSelectedPhotos(selectedPhotos.filter(id => id !== photoId))
    } else {
      setSelectedPhotos([...selectedPhotos, photoId])
    }
  }

  const handleConfirm = () => {
    onSelect(selectedPhotos)
    onClose()
  }

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = !selectedFolder || photo.original_path.startsWith(selectedFolder)
    return matchesSearch && matchesFolder
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('photos.selectPhotos')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-3">
          <input
            type="text"
            placeholder={t('placeholders.photoSearch')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="relative">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-gray-700 font-medium shadow-sm hover:border-gray-400 transition-colors"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              <option value="" className="text-gray-500">{t('photos.allFolders')}</option>
              {folders.map((folder) => (
                <option key={folder} value={folder} className="text-gray-900">
                  {folder.split('/').slice(-2).join('/')}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredPhotos.length} {t('photos.photosFound')}</span>
            <span className="font-medium text-blue-600">
              {selectedPhotos.length} {t('photos.selected')}
            </span>
          </div>
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>{t('ui.noPhotosInCollection')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredPhotos.map((photo) => {
                const isSelected = selectedPhotos.includes(photo.id)
                return (
                  <button
                    key={photo.id}
                    onClick={() => handlePhotoClick(photo.id)}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                      ${isSelected
                        ? 'border-blue-500 ring-2 ring-blue-200 scale-95'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <img
                      src={convertFileSrc(photo.file_path)}
                      alt={photo.file_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.classList.add('bg-gray-100')
                      }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                        <div className="bg-blue-600 text-white rounded-full p-1">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-white text-xs truncate">{photo.file_name}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPhotos.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {t('common.confirm')} ({selectedPhotos.length})
          </button>
        </div>
      </div>
    </div>
  )
}
