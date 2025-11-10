import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { objectsAPI } from '../utils/api'
import PhotoSelector from './PhotoSelector'
import { useLanguage } from '../contexts/LanguageContext'

export default function ObjectDetail({ object, onClose, onUpdate, onDelete, onDeleteRequest, onPhotoUpdate, categories = [] }) {
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: object.name,
    description: object.description || '',
    year: object.year || '',
    weight: object.weight || '',
    category_id: object.category_id || '',
  })
  const [associatedPhotos, setAssociatedPhotos] = useState([])
  const [showPhotoSelector, setShowPhotoSelector] = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  useEffect(() => {
    loadAssociatedPhotos()
  }, [object.id])

  const loadAssociatedPhotos = async () => {
    setLoadingPhotos(true)
    try {
      const photos = await invoke('get_object_photos', { objectId: object.id })
      setAssociatedPhotos(photos)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoadingPhotos(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    const updateData = {
      name: formData.name !== object.name ? formData.name : null,
      description: formData.description !== object.description ? formData.description : null,
      year: formData.year && formData.year !== object.year ? parseInt(formData.year) : null,
      weight: formData.weight && formData.weight !== object.weight ? parseFloat(formData.weight) : null,
      category_id: formData.category_id !== object.category_id ? (formData.category_id ? parseInt(formData.category_id) : null) : null,
    }

    try {
      const updated = await objectsAPI.update(object.id, updateData)
      onUpdate(updated)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating object:', error)
      alert(t('errors.updatingObject'))
    }
  }

  const handleDeleteClick = () => {
    if (onDeleteRequest) {
      onDeleteRequest()
    }
  }

  const handlePhotoSelection = async (selectedPhotoIds) => {
    try {
      // Reload current associations to ensure we have the latest state
      const currentPhotos = await invoke('get_object_photos', { objectId: object.id })
      const currentIds = currentPhotos.map(p => p.id)

      // Remove photos that are no longer selected
      for (const photo of currentPhotos) {
        if (!selectedPhotoIds.includes(photo.id)) {
          await invoke('dissociate_photo', { id: photo.association_id })
        }
      }

      // Add newly selected photos
      for (const photoId of selectedPhotoIds) {
        if (!currentIds.includes(photoId)) {
          await invoke('associate_photo', {
            objectId: object.id,
            request: { photo_id: photoId }
          })
        }
      }

      // Reload photos and update object list
      await loadAssociatedPhotos()
      if (onPhotoUpdate) {
        onPhotoUpdate()
      }
    } catch (error) {
      console.error('Error updating photo associations:', error)
      alert(t('errors.updatingAssociations'))
    }
  }

  const handleRemovePhoto = async (photoId) => {
    try {
      const photo = associatedPhotos.find(p => p.id === photoId)
      if (photo && photo.association_id) {
        await invoke('dissociate_photo', { id: photo.association_id })
        await loadAssociatedPhotos()
        if (onPhotoUpdate) {
          onPhotoUpdate()
        }
      }
    } catch (error) {
      console.error('Error removing photo:', error)
      alert(t('errors.removingPhoto'))
    }
  }

  // Get category name if exists
  const categoryName = object.category_id
    ? categories.find(c => c.id === object.category_id)?.name
    : null

  return (
    <>
      {!isEditing ? (
            <div className="space-y-6">
              {object.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {t('common.description')}
                  </h3>
                  <p className="text-gray-900">{object.description}</p>
                </div>
              )}

              {categoryName && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {t('common.category')}
                  </h3>
                  <span className="inline-block px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {categoryName}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {object.year && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('common.year')}
                    </h3>
                    <p className="text-gray-900">{object.year}</p>
                  </div>
                )}

                {object.weight && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('common.weight')}
                    </h3>
                    <p className="text-gray-900">{object.weight} kg</p>
                  </div>
                )}
              </div>

              {/* Photos Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-500">
                    {t('ui.associatedPhotos')} ({associatedPhotos.length})
                  </h3>
                  <button
                    onClick={() => setShowPhotoSelector(true)}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium"
                  >
                    {t('ui.managePhotos')}
                  </button>
                </div>

                {loadingPhotos ? (
                  <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : associatedPhotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-lg text-gray-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">{t('ui.noAssociatedPhotos')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {associatedPhotos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        <img
                          src={convertFileSrc(photo.file_path)}
                          alt={photo.file_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.classList.add('bg-gray-100')
                          }}
                        />
                        <button
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title={t('interface.removePhoto')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 text-sm text-gray-500">
                <p>{t('ui.createdAt')} {new Date(object.created_at).toLocaleString('fr-FR')}</p>
                <p>{t('ui.modifiedAt')} {new Date(object.updated_at).toLocaleString('fr-FR')}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('common.edit')}
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6">
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>

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
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    >
                      <option value="" className="text-gray-500">Sélectionner une catégorie</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id} className="text-gray-900">
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
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}

      <PhotoSelector
        isOpen={showPhotoSelector}
        onClose={() => setShowPhotoSelector(false)}
        onSelect={handlePhotoSelection}
        objectId={object.id}
      />
    </>
  )
}
