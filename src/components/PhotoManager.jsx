import { useState, useEffect, useMemo } from 'react'
import { photosAPI } from '../utils/api'
import { open } from '@tauri-apps/api/dialog'
import PhotoTreeView from './PhotoTreeView'
import PhotoDetail from './PhotoDetail'
import ConfirmModal from './ConfirmModal'
import { useLanguage } from '../contexts/LanguageContext'

export default function PhotoManager() {
  const { t } = useLanguage()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedItems, setSelectedItems] = useState([]) // Can be 'photo-{id}' or 'folder-{path}'
  const [scanning, setScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  const [deleteInfo, setDeleteInfo] = useState({ folders: 0, photos: 0 })
  const [deletePhysicalFiles, setDeletePhysicalFiles] = useState(true)
  const [currentPath, setCurrentPath] = useState([])
  const [commonRoot, setCommonRoot] = useState([])

  useEffect(() => {
    loadPhotos()
  }, [])

  // Calculate commonRoot from photos
  useEffect(() => {
    if (photos.length === 0) {
      setCommonRoot([])
      return
    }

    const paths = photos.map(p => p.original_path.split('/').filter(part => part !== ''))

    if (paths.length === 1) {
      const pathParts = [...paths[0]]
      pathParts.pop()
      setCommonRoot(pathParts)
      return
    }

    let commonParts = paths[0]
    for (let i = 1; i < paths.length; i++) {
      const currentPathArr = paths[i]
      const newCommon = []

      for (let j = 0; j < Math.min(commonParts.length, currentPathArr.length - 1); j++) {
        if (commonParts[j] === currentPathArr[j]) {
          newCommon.push(commonParts[j])
        } else {
          break
        }
      }

      commonParts = newCommon
      if (commonParts.length === 0) break
    }

    setCommonRoot(commonParts)
  }, [photos])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      const data = await photosAPI.list()
      setPhotos(data)
      setError(null)
    } catch (err) {
      console.error('Error loading photos:', err)
      setError(t('errors.loadingPhotos'))
    } finally {
      setLoading(false)
    }
  }

  const handleScanDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('photoManager.scanningDirectory')
      })

      if (selected) {
        setScanning(true)
        setError(null)
        const result = await photosAPI.scanDirectory(selected)
        await loadPhotos()

        if (result.errors && result.errors.length > 0) {
          setError(`${result.imported} ${t('ui.photoImported')}, ${result.errors.length} ${t('ui.errorEncountered')}`)
        }
      }
    } catch (err) {
      console.error('Error scanning directory:', err)
      setError(t('photoManager.scanningError'))
    } finally {
      setScanning(false)
    }
  }

  const handleToggleSelect = (itemId, action, photosInFolder) => {
    if (action === 'select-all' && photosInFolder) {
      // Select folder and all its photos
      setSelectedItems(prev => {
        const photoIds = photosInFolder.map(p => `photo-${p.id}`)
        const newSelection = new Set([...prev, itemId, ...photoIds])
        return Array.from(newSelection)
      })
    } else if (action === 'deselect-all' && photosInFolder) {
      // Deselect folder and all its photos
      setSelectedItems(prev => {
        const photoIds = photosInFolder.map(p => `photo-${p.id}`)
        return prev.filter(id => id !== itemId && !photoIds.includes(id))
      })
    } else {
      // Simple toggle for a photo
      setSelectedItems(prev =>
        prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      )
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return

    const folders = selectedItems.filter(id => id.startsWith('folder-'))
    const photoIds = selectedItems.filter(id => id.startsWith('photo-'))

    setDeleteInfo({ folders: folders.length, photos: photoIds.length })
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    const folders = selectedItems.filter(id => id.startsWith('folder-'))
    const photoIds = selectedItems
      .filter(id => id.startsWith('photo-'))
      .map(id => parseInt(id.replace('photo-', '')))

    try {
      let deletedCount = 0
      let errors = []

      // Delete folders
      for (const folderId of folders) {
        const folderPath = folderId.replace('folder-', '')
        try {
          const result = deletePhysicalFiles
            ? await photosAPI.deleteFolder(folderPath)
            : await photosAPI.deleteFolderDbOnly(folderPath)
          deletedCount += result.deleted
          if (result.errors && result.errors.length > 0) {
            errors = errors.concat(result.errors)
          }
        } catch (err) {
          errors.push(`Error folder ${folderPath}: ${err}`)
        }
      }

      // Delete individual photos
      for (const photoId of photoIds) {
        try {
          if (deletePhysicalFiles) {
            await photosAPI.delete(photoId)
          } else {
            await photosAPI.deleteDbOnly(photoId)
          }
          deletedCount++
        } catch (err) {
          errors.push(`Error photo ${photoId}: ${err}`)
        }
      }

      await loadPhotos()
      setSelectedItems([])
    } catch (err) {
      console.error('Error deleting items:', err)
      setError(t('photoManager.deletingError'))
    }
  }

  const handleRefreshClick = () => {
    setShowRefreshModal(true)
  }

  const confirmRefresh = async () => {
    // Build full path of current directory
    const fullPath = [...commonRoot, ...currentPath].join('/')

    if (!fullPath) {
      setError(t('photoManager.cannotDetermineDirectory'))
      return
    }

    try {
      setScanning(true)
      setError(null)
      const result = await photosAPI.scanDirectory('/' + fullPath)
      await loadPhotos()

      if (result.errors && result.errors.length > 0) {
        setError(`${result.imported} ${t('ui.photoAdded')}, ${result.errors.length} ${t('ui.errorEncountered')}`)
      }
    } catch (err) {
      console.error('Error rescanning directory:', err)
      setError(t('photoManager.rescanError'))
    } finally {
      setScanning(false)
    }
  }

  const handleSelectAll = () => {
    // Build tree structure like in PhotoTreeView
    const tree = { folders: {}, photos: [] }

    filteredPhotos.forEach(photo => {
      const pathParts = photo.original_path.split('/').filter(part => part !== '')
      const fileName = pathParts.pop()
      const relativeParts = pathParts.slice(commonRoot.length)

      let current = tree
      relativeParts.forEach((part, index) => {
        if (!current.folders[part]) {
          current.folders[part] = {
            folders: {},
            photos: [],
            fullPath: [...commonRoot, ...relativeParts.slice(0, index + 1)].join('/')
          }
        }
        current = current.folders[part]
      })

      current.photos.push({ ...photo, fileName })
    })

    // Navigate to current directory
    let currentFolder = tree
    currentPath.forEach(folderName => {
      currentFolder = currentFolder.folders[folderName]
    })

    // Collect all IDs from current folder
    const allFolderIds = Object.entries(currentFolder.folders).map(([_, folder]) => `folder-${folder.fullPath}`)
    const allPhotoIds = currentFolder.photos.map(photo => `photo-${photo.id}`)
    const allIds = [...allFolderIds, ...allPhotoIds]

    // Check if all are already selected
    const areAllSelected = allIds.length > 0 && allIds.every(id => selectedItems.includes(id))

    if (areAllSelected) {
      // Deselect all
      setSelectedItems([])
    } else {
      // Select all
      setSelectedItems(allIds)
    }
  }

  const handleEditPhoto = (photo) => {
    setSelectedPhoto(photo)
  }

  const handleDeleteItems = (itemIds) => {
    if (itemIds.length === 0) return

    const folders = itemIds.filter(id => id.startsWith('folder-'))
    const photoIds = itemIds.filter(id => id.startsWith('photo-'))

    setDeleteInfo({ folders: folders.length, photos: photoIds.length })
    setSelectedItems(itemIds)
    setShowDeleteModal(true)
  }

  const filteredPhotos = photos.filter(photo =>
    photo.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (photo.original_path && photo.original_path.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder={t('placeholders.photoSearch')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleRefreshClick}
          disabled={scanning}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors whitespace-nowrap flex items-center gap-2 disabled:bg-gray-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('common.refresh')}
        </button>
        <button
          onClick={handleScanDirectory}
          disabled={scanning}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap disabled:bg-blue-400"
        >
          {scanning ? t('ui.addingInProgress') : '+ ' + t('ui.addFolder')}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>
            <span className="ml-2 font-semibold text-gray-900">{photos.length} {t('ui.photosLowercase')}</span>
          </div>
          {selectedItems.length > 0 && (
            <>
              <div>
                <span className="text-gray-500">{t('ui.selected')}</span>
                <span className="ml-2 font-semibold text-blue-600">{selectedItems.length} {t('ui.items')}</span>
              </div>
              <button
                onClick={handleDeleteSelected}
                className="ml-auto text-red-600 hover:text-red-700 font-medium"
              >
                {t('ui.deleteSelection')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Photo Tree View */}
      <div className="bg-white rounded-lg shadow p-6">
        <PhotoTreeView
          photos={filteredPhotos}
          onPhotoClick={setSelectedPhoto}
          selectedItems={selectedItems}
          onToggleSelect={handleToggleSelect}
          currentPath={currentPath}
          onPathChange={setCurrentPath}
          onSelectAll={handleSelectAll}
          onEditPhoto={handleEditPhoto}
          onDeleteItems={handleDeleteItems}
        />
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <PhotoDetail
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onPhotoUpdated={(updatedPhoto) => {
            // Add cache buster to force image reload
            const photoWithCacheBuster = {
              ...updatedPhoto,
              _cacheKey: Date.now()
            }

            // Check if it's the same photo (updated) or a new copy
            const existingPhoto = photos.find(p => p.id === updatedPhoto.id)
            if (existingPhoto) {
              // Update existing photo
              setPhotos(photos.map(p => p.id === updatedPhoto.id ? photoWithCacheBuster : p))
            } else {
              // Add new photo (copy)
              setPhotos([photoWithCacheBuster, ...photos])
            }
            setSelectedPhoto(photoWithCacheBuster)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={t('ui.confirmDeletion')}
        message={`${t('common.confirm')} ${deleteInfo.folders + deleteInfo.photos} ${t('ui.items')} ?\n\n${deleteInfo.folders} ${t('ui.folders')}\n${deleteInfo.photos} ${t('ui.photosLowercase')}`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        danger={true}
      >
        {/* Switch for physical deletion */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label htmlFor="delete-physical" className="text-sm font-medium text-gray-900 block">
                {t('ui.deleteFromSystem')}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {deletePhysicalFiles
                  ? t('ui.filesWillBePermanentlyDeleted')
                  : t('ui.filesWillRemainReferencesRemoved')}
              </p>
            </div>
            <button
              type="button"
              id="delete-physical"
              onClick={() => setDeletePhysicalFiles(!deletePhysicalFiles)}
              className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                deletePhysicalFiles ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  deletePhysicalFiles ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </ConfirmModal>

      {/* Refresh Confirmation Modal */}
      <ConfirmModal
        isOpen={showRefreshModal}
        onClose={() => setShowRefreshModal(false)}
        onConfirm={confirmRefresh}
        title={t('ui.rescanDirectory')}
        message={`${t('ui.rescanDirectoryConfirm')}\n\n${t('ui.directory')} /${[...commonRoot, ...currentPath].join('/')}`}
        confirmText={t('ui.rescan')}
        cancelText={t('common.cancel')}
        danger={false}
      />
    </div>
  )
}
