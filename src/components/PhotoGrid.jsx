import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useLanguage } from '../contexts/LanguageContext'

export default function PhotoGrid({ photos, onPhotoClick, selectedPhotos = [], onToggleSelect }) {
  const { t } = useLanguage()

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2">{t('ui.noPhotosInCollection')}</p>
        <p className="text-sm mt-1">{t('ui.scanDirectory')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {photos.map((photo) => {
        const isSelected = selectedPhotos.includes(photo.id)
        const imageSrc = convertFileSrc(photo.file_path)

        return (
          <div
            key={photo.id}
            className={`relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square ${
              isSelected ? 'ring-4 ring-blue-500' : ''
            }`}
          >
            {/* Image */}
            <img
              src={imageSrc}
              alt={photo.file_name}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              onClick={() => onPhotoClick(photo)}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">Error</text></svg>'
              }}
            />

            {/* Selection checkbox */}
            {onToggleSelect && (
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(photo.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </div>
            )}

            {/* Info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate" title={photo.file_name}>
                {photo.file_name}
              </p>
              {photo.width && photo.height && (
                <p className="text-white/80 text-xs">
                  {photo.width}×{photo.height}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
