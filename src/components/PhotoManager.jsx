import { useState, useEffect, useMemo } from 'react'
import { photosAPI } from '../utils/api'
import PhotoTreeView from './PhotoTreeView'
import PhotoDetail from './PhotoDetail'
import ConfirmModal from './ConfirmModal'
import MoveToFolderModal from './MoveToFolderModal'
import { useLanguage } from '../contexts/LanguageContext'

export default function PhotoManager() {
  const { t } = useLanguage()
  const [photos, setPhotos] = useState([])
  const [folders, setFolders] = useState([]) // Real-time folder structure from file system
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [selectedItems, setSelectedItems] = useState([]) // Can be 'photo-{id}' or 'folder-{path}'
  const [scanning, setScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [deleteInfo, setDeleteInfo] = useState({ folders: 0, photos: 0 })
  const [deletePhysicalFiles, setDeletePhysicalFiles] = useState(true)
  const [currentFolderId, setCurrentFolderId] = useState(null) // null = root
  const [rootFolder, setRootFolder] = useState(null) // Root folder path

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    await loadPhotos()
    await loadRootFolder()
  }

  const loadRootFolder = async () => {
    try {
      const root = await photosAPI.getRootFolder()
      setRootFolder(root)
    } catch (err) {
      console.error('Error loading root folder:', err)
    }
  }

  const loadPhotos = async () => {
    try {
      setLoading(true)

      // Load photos and folders from database
      const [photosData, foldersData] = await Promise.all([
        photosAPI.list(),
        photosAPI.listFolders()
      ])

      setPhotos(photosData)
      setFolders(foldersData || [])
      setError(null)
    } catch (err) {
      console.error('Error loading photos:', err)
      setError(t('errors.loadingPhotos'))
    } finally {
      setLoading(false)
    }
  }

  const handleSyncDatabase = async () => {
    try {
      setScanning(true)
      setError(null)
      const result = await photosAPI.syncDatabase()
      await loadPhotos()

      const messages = []
      if (result.photos_removed > 0) {
        messages.push(`${result.photos_removed} ${t('ui.photosRemoved')}`)
      }
      if (result.photos_updated > 0) {
        messages.push(`${result.photos_updated} ${t('ui.photosUpdated')}`)
      }
      if (result.folders_cleaned > 0) {
        messages.push(`${result.folders_cleaned} ${t('ui.foldersRemoved')}`)
      }

      if (messages.length > 0) {
        setError(messages.join(', '))
      }

      if (result.errors && result.errors.length > 0) {
        console.error('Sync errors:', result.errors)
      }
    } catch (err) {
      console.error('Error syncing database:', err)
      setError(t('photoManager.syncError'))
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
        const absolutePath = '/' + folderPath
        try {
          const result = deletePhysicalFiles
            ? await photosAPI.deleteFolder(absolutePath)
            : await photosAPI.deleteFolderDbOnly(absolutePath)
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
      setShowDeleteModal(false)
    } catch (err) {
      console.error('Error deleting items:', err)
      setError(t('photoManager.deletingError'))
      setShowDeleteModal(false)
    }
  }

  const handleRefreshClick = () => {
    setShowRefreshModal(true)
  }

  const confirmRefresh = async () => {
    // Get folder path from current folder
    let folderPath = ''
    if (currentFolderId !== null) {
      const currentFolder = folders.find(f => f.id === currentFolderId)
      if (currentFolder) {
        folderPath = currentFolder.path
      }
    }

    if (!folderPath) {
      setError(t('photoManager.cannotDetermineDirectory'))
      return
    }

    try {
      setScanning(true)
      setError(null)
      const result = await photosAPI.scanDirectory(folderPath)
      await loadPhotos()
      setShowRefreshModal(false)

      if (result.errors && result.errors.length > 0) {
        setError(`${result.imported} ${t('ui.photoAdded')}, ${result.errors.length} ${t('ui.errorEncountered')}`)
      }
    } catch (err) {
      console.error('Error rescanning directory:', err)
      setError(t('photoManager.rescanError'))
      setShowRefreshModal(false)
    } finally {
      setScanning(false)
    }
  }

  const handleSelectAll = () => {
    // Get folders and photos in current folder
    const currentFolderChildren = folders.filter(f => f.parent_id === currentFolderId)
    const currentFolderPhotos = filteredPhotos.filter(p => p.folder_id === currentFolderId)

    // Collect all IDs from current folder
    const allFolderIds = currentFolderChildren.map(f => `folder-${f.path}`)
    const allPhotoIds = currentFolderPhotos.map(p => `photo-${p.id}`)
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
    setEditingPhoto(photo)
  }

  const handleDeleteItems = (itemIds) => {
    if (itemIds.length === 0) return

    const folders = itemIds.filter(id => id.startsWith('folder-'))
    const photoIds = itemIds.filter(id => id.startsWith('photo-'))

    setDeleteInfo({ folders: folders.length, photos: photoIds.length })
    setSelectedItems(itemIds)
    setShowDeleteModal(true)
  }

  const handleMoveSelected = () => {
    if (selectedItems.length === 0) return
    setShowMoveModal(true)
  }

  const handleMoveItems = (itemIds) => {
    if (itemIds.length === 0) return
    setSelectedItems(itemIds)
    setShowMoveModal(true)
  }

  const confirmMove = async (destinationPath) => {
    const folders = selectedItems
      .filter(id => id.startsWith('folder-'))
      .map(id => '/' + id.replace('folder-', '')) // Add "/" prefix for absolute paths

    const photoIds = selectedItems
      .filter(id => id.startsWith('photo-'))
      .map(id => parseInt(id.replace('photo-', '')))

    try {
      setScanning(true)
      setError(null)

      const result = await photosAPI.moveItems(photoIds, folders, destinationPath)

      // Close modal first
      setShowMoveModal(false)

      // Reload photos
      await loadPhotos()

      // Reset current path to show root (where user can see the changes)
      setCurrentPath([])

      // Clear selection
      setSelectedItems([])

      // Show success message if there were errors
      if (result.errors && result.errors.length > 0) {
        setError(`${t('ui.moveSuccess')} - ${result.moved} ${t('ui.items')}. ${result.errors.length} ${t('ui.errorEncountered')}`)
      }
    } catch (err) {
      console.error('Error moving items:', err)
      setError(t('ui.moveError') + ': ' + (err.message || err))
    } finally {
      setScanning(false)
    }
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
          onClick={handleSyncDatabase}
          disabled={scanning}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors whitespace-nowrap flex items-center gap-2 disabled:bg-green-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {t('ui.syncDatabase')}
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
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handleMoveSelected}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('ui.moveSelection')}
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  {t('ui.deleteSelection')}
                </button>
              </div>
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
          folders={folders}
          onPhotoClick={setSelectedPhoto}
          selectedItems={selectedItems}
          onToggleSelect={handleToggleSelect}
          currentFolderId={currentFolderId}
          onFolderChange={setCurrentFolderId}
          onSelectAll={handleSelectAll}
          onEditPhoto={handleEditPhoto}
          onDeleteItems={handleDeleteItems}
          onMoveItems={handleMoveItems}
          rootFolder={rootFolder}
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

      {/* Photo Edit Modal (Direct from context menu) */}
      {editingPhoto && (
        <PhotoDetail
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          initialEditMode={true}
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
            setEditingPhoto(null)
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
        message={`${t('ui.rescanDirectoryConfirm')}\n\n${t('ui.directory')} ${currentFolderId !== null ? folders.find(f => f.id === currentFolderId)?.path || '/' : '/'}`}
        confirmText={t('ui.rescan')}
        cancelText={t('common.cancel')}
        danger={false}
      />

      {/* Move To Folder Modal */}
      <MoveToFolderModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onConfirm={confirmMove}
        photos={photos}
        folders={folders}
        selectedItems={selectedItems}
        onFolderCreated={loadPhotos}
      />
    </div>
  )
}
