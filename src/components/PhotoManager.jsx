import { useState, useEffect, useMemo } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { photosAPI, textFilesAPI, objectsAPI } from '../utils/api'
import PhotoTreeView from './PhotoTreeView'
import PhotoDetail from './PhotoDetail'
import TextFileEdit from './TextFileEdit'
import ConfirmModal from './ConfirmModal'
import MoveToFolderModal from './MoveToFolderModal'
import CreateObjectModal from './CreateObjectModal'
import { useLanguage } from '../contexts/LanguageContext'

export default function PhotoManager() {
  const { t } = useLanguage()
  const [photos, setPhotos] = useState([])
  const [textFiles, setTextFiles] = useState([])
  const [folders, setFolders] = useState([]) // Real-time folder structure from file system
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [editingTextFile, setEditingTextFile] = useState(null)
  const [selectedItems, setSelectedItems] = useState([]) // Can be 'photo-{id}', 'folder-{path}', or 'textfile-{id}'
  const [scanning, setScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showCreateObjectModal, setShowCreateObjectModal] = useState(false)
  const [deleteInfo, setDeleteInfo] = useState({ folders: 0, photos: 0 })
  const [deletePhysicalFiles, setDeletePhysicalFiles] = useState(true)
  const [currentFolderId, setCurrentFolderId] = useState(null) // null = root
  const [rootFolder, setRootFolder] = useState(null) // Root folder path
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    await loadPhotos()
    await loadRootFolder()
    await loadCategories()
  }

  const loadRootFolder = async () => {
    try {
      const root = await photosAPI.getRootFolder()
      setRootFolder(root)
    } catch (err) {
      console.error('Error loading root folder:', err)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await invoke('list_categories')
      setCategories(data)
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadPhotos = async () => {
    try {
      setLoading(true)

      // Load photos, text files, and folders from database
      const [photosData, textFilesData, foldersData] = await Promise.all([
        photosAPI.list(),
        textFilesAPI.list(),
        photosAPI.listFolders()
      ])

      console.log('[PhotoManager] Loaded folders:', foldersData?.length)
      console.log('[PhotoManager] Folder paths:', foldersData?.map(f => f.path))
      console.log('[PhotoManager] Loaded text files:', textFilesData?.length)

      setPhotos(photosData)
      setTextFiles(textFilesData)
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
      if (result.text_files_removed > 0) {
        messages.push(`${result.text_files_removed} text files removed`)
      }
      if (result.text_files_updated > 0) {
        messages.push(`${result.text_files_updated} text files updated`)
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
    const textFileIds = selectedItems.filter(id => id.startsWith('textfile-'))

    setDeleteInfo({ folders: folders.length, photos: photoIds.length, textFiles: textFileIds.length })
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    const folders = selectedItems.filter(id => id.startsWith('folder-'))
    const photoIds = selectedItems
      .filter(id => id.startsWith('photo-'))
      .map(id => parseInt(id.replace('photo-', '')))
    const textFileIds = selectedItems
      .filter(id => id.startsWith('textfile-'))
      .map(id => parseInt(id.replace('textfile-', '')))

    try {
      let deletedCount = 0
      let errors = []

      // Delete folders
      for (const folderId of folders) {
        const folderPath = folderId.replace('folder-', '')
        // folderPath is already an absolute path, no need to add '/'
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

      // Delete individual text files
      for (const textFileId of textFileIds) {
        try {
          if (deletePhysicalFiles) {
            await textFilesAPI.delete(textFileId)
          } else {
            await textFilesAPI.deleteDbOnly(textFileId)
          }
          deletedCount++
        } catch (err) {
          errors.push(`Error text file ${textFileId}: ${err}`)
        }
      }

      // Close modal first
      setShowDeleteModal(false)

      // Reload photos
      await loadPhotos()

      // Clear selection
      setSelectedItems([])
    } catch (err) {
      console.error('Error deleting items:', err)
      setError(t('photoManager.deletingError'))
      setShowDeleteModal(false)
    }
  }

  const handleSelectAll = () => {
    // Get filtered folders, photos, and text files in current folder
    // filteredFolders, filteredPhotos, and filteredTextFiles already contain only current folder items matching search

    // Collect all IDs from current folder, excluding level 1 folders (parent_id === null)
    const allFolderIds = filteredFolders
      .filter(f => f.parent_id !== null) // Only level 2+ folders can be selected
      .map(f => `folder-${f.path}`)
    const allPhotoIds = filteredPhotos.map(p => `photo-${p.id}`)
    const allTextFileIds = filteredTextFiles.map(tf => `textfile-${tf.id}`)
    const allIds = [...allFolderIds, ...allPhotoIds, ...allTextFileIds]

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

  const handleEditTextFile = (textFile) => {
    setEditingTextFile(textFile)
  }

  const handleDeleteItems = (itemIds) => {
    if (itemIds.length === 0) return

    const folders = itemIds.filter(id => id.startsWith('folder-'))
    const photoIds = itemIds.filter(id => id.startsWith('photo-'))
    const textFileIds = itemIds.filter(id => id.startsWith('textfile-'))

    setDeleteInfo({ folders: folders.length, photos: photoIds.length, textFiles: textFileIds.length })
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

  const handleCopyItems = (itemIds) => {
    if (itemIds.length === 0) return
    setSelectedItems(itemIds)
    setShowCopyModal(true)
  }

  const handleFolderChange = (folderId) => {
    // Clear selection when navigating to a different folder
    setSelectedItems([])
    setCurrentFolderId(folderId)
  }

  const confirmMove = async (destinationPath) => {
    const movingFolders = selectedItems
      .filter(id => id.startsWith('folder-'))
      .map(id => id.replace('folder-', '')) // Path is already absolute

    const photoIds = selectedItems
      .filter(id => id.startsWith('photo-'))
      .map(id => parseInt(id.replace('photo-', '')))

    const textFileIds = selectedItems
      .filter(id => id.startsWith('textfile-'))
      .map(id => parseInt(id.replace('textfile-', '')))

    try {
      setScanning(true)
      setError(null)

      const result = await photosAPI.moveItems(photoIds, textFileIds, movingFolders, destinationPath)

      // Close modal first
      setShowMoveModal(false)

      // Reload photos
      await loadPhotos()

      // Navigate to destination folder to show the moved items
      const destinationFolder = folders.find(f => f.path === destinationPath)
      if (destinationFolder) {
        setCurrentFolderId(destinationFolder.id)
      } else {
        // Fallback to root if destination folder not found
        setCurrentFolderId(null)
      }

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

  const handleCopySelected = () => {
    if (selectedItems.length === 0) return
    setShowCopyModal(true)
  }

  const handleCreateObject = () => {
    if (selectedItems.length === 0) return
    setShowCreateObjectModal(true)
  }

  const confirmCreateObject = async (objectData) => {
    try {
      setScanning(true)

      // Create the object
      const createdObject = await objectsAPI.create(objectData)

      // Get selected photo IDs
      const photoIds = selectedItems
        .filter(id => id.startsWith('photo-'))
        .map(id => parseInt(id.replace('photo-', '')))

      // Associate all selected photos to the object
      for (const photoId of photoIds) {
        try {
          await photosAPI.associateToObject(photoId, createdObject.id)
        } catch (err) {
          console.error(`Error associating photo ${photoId}:`, err)
        }
      }

      // Close modal
      setShowCreateObjectModal(false)

      // Clear selection
      setSelectedItems([])

      // Show success message with link to object
      const message = `${t('objects.createObjectSuccess')} - ${t('objects.viewObject')}: ${createdObject.name}`
      setError(message)

      // Reload photos to update associations
      await loadPhotos()
    } catch (err) {
      console.error('Error creating object:', err)
      setError(t('errors.creatingObject') + ': ' + (err.message || err))
    } finally {
      setScanning(false)
    }
  }

  const confirmCopy = async (destinationPath) => {
    const copyingFolders = selectedItems
      .filter(id => id.startsWith('folder-'))
      .map(id => id.replace('folder-', '')) // Path is already absolute

    const photoIds = selectedItems
      .filter(id => id.startsWith('photo-'))
      .map(id => parseInt(id.replace('photo-', '')))

    const textFileIds = selectedItems
      .filter(id => id.startsWith('textfile-'))
      .map(id => parseInt(id.replace('textfile-', '')))

    try {
      setScanning(true)
      setError(null)

      const result = await photosAPI.copyItems(photoIds, textFileIds, copyingFolders, destinationPath)

      // Close modal first
      setShowCopyModal(false)

      // Reload photos
      await loadPhotos()

      // Navigate to destination folder to show the copied items
      const destinationFolder = folders.find(f => f.path === destinationPath)
      if (destinationFolder) {
        setCurrentFolderId(destinationFolder.id)
      } else {
        // Fallback to root if destination folder not found
        setCurrentFolderId(null)
      }

      // Clear selection
      setSelectedItems([])

      // Show success message if there were errors
      if (result.errors && result.errors.length > 0) {
        setError(`${t('ui.copySuccess')} - ${result.copied} ${t('ui.items')}. ${result.errors.length} ${t('ui.errorEncountered')}`)
      }
    } catch (err) {
      console.error('Error copying items:', err)
      setError(t('ui.copyError') + ': ' + (err.message || err))
    } finally {
      setScanning(false)
    }
  }

  // First filter by current folder (visual level), then apply search query
  const currentFolderPhotos = photos.filter(p => p.folder_id === currentFolderId)
  const filteredPhotos = currentFolderPhotos.filter(photo =>
    photo.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (photo.original_path && photo.original_path.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Filter folders in current level by search query
  const currentFolderSubfolders = folders.filter(f => f.parent_id === currentFolderId)
  const filteredFolders = currentFolderSubfolders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (folder.path && folder.path.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Filter text files in current folder by search query
  const currentFolderTextFiles = textFiles.filter(tf => tf.folder_id === currentFolderId)
  const filteredTextFiles = currentFolderTextFiles.filter(textFile =>
    textFile.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (textFile.file_path && textFile.file_path.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Determine if "Create Object" button should be visible
  // Visible only in subfolders of root category folders
  const shouldShowCreateObjectButton = useMemo(() => {
    if (currentFolderId === null) return false // Not at root level

    const currentFolder = folders.find(f => f.id === currentFolderId)
    if (!currentFolder) return false

    // Check if parent exists and is a root folder (parent_id === null)
    if (currentFolder.parent_id === null) return false // We are at a root category folder

    const parentFolder = folders.find(f => f.id === currentFolder.parent_id)
    if (!parentFolder || parentFolder.parent_id !== null) return false // Parent is not a root folder

    // Check if there's at least one photo or text file selected
    const hasPhotos = selectedItems.some(id => id.startsWith('photo-'))
    const hasTextFiles = selectedItems.some(id => id.startsWith('textfile-'))

    return hasPhotos || hasTextFiles
  }, [currentFolderId, folders, selectedItems])

  // Get current folder info for modal
  const currentFolderInfo = useMemo(() => {
    if (currentFolderId === null) return null
    const currentFolder = folders.find(f => f.id === currentFolderId)
    return currentFolder || null
  }, [currentFolderId, folders])

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
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder={t('placeholders.photoSearch')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedItems.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleCopySelected}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('common.copy')}
            </button>
            <button
              onClick={handleMoveSelected}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {t('common.move')}
            </button>
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('common.delete')}
            </button>
            {shouldShowCreateObjectButton && (
              <button
                onClick={() => setShowCreateObjectModal(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t('objects.createObject')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-6 text-sm items-center">
          <div>
            <span className="text-gray-500">Total:</span>
            <span className="ml-2 font-semibold text-gray-900">{photos.length} {t('ui.photosLowercase')}, {textFiles.length} text files</span>
          </div>
          {selectedItems.length > 0 && (
            <div>
              <span className="text-gray-500">{t('ui.selected')}</span>
              <span className="ml-2 font-semibold text-blue-600">{selectedItems.length} {t('ui.items')}</span>
            </div>
          )}
          <div className="ml-auto">
            <button
              onClick={handleSelectAll}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              {(() => {
                // filteredFolders, filteredPhotos, and filteredTextFiles already contain only current folder items matching search
                // Exclude level 1 folders (parent_id === null) from selection
                const allIds = [
                  ...filteredFolders.filter(f => f.parent_id !== null).map(f => `folder-${f.path}`),
                  ...filteredPhotos.map(p => `photo-${p.id}`),
                  ...filteredTextFiles.map(tf => `textfile-${tf.id}`)
                ]
                const areAllSelected = allIds.length > 0 && allIds.every(id => selectedItems.includes(id))
                return areAllSelected ? t('ui.deselectAll') : t('ui.selectAll')
              })()}
            </button>
          </div>
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
          textFiles={filteredTextFiles}
          folders={filteredFolders}
          onPhotoClick={setSelectedPhoto}
          onTextFileClick={handleEditTextFile}
          selectedItems={selectedItems}
          onToggleSelect={handleToggleSelect}
          currentFolderId={currentFolderId}
          onFolderChange={handleFolderChange}
          onSelectAll={handleSelectAll}
          onEditPhoto={handleEditPhoto}
          onEditTextFile={handleEditTextFile}
          onDeleteItems={handleDeleteItems}
          onMoveItems={handleMoveItems}
          onCopyItems={handleCopyItems}
          rootFolder={rootFolder}
          allFolders={folders}
          allPhotos={photos}
          allTextFiles={textFiles}
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
        message={`${t('common.confirm')} ${deleteInfo.folders + deleteInfo.photos + (deleteInfo.textFiles || 0)} ${t('ui.items')} ?\n\n${deleteInfo.folders} ${t('ui.folders')}\n${deleteInfo.photos} ${t('ui.photosLowercase')}\n${deleteInfo.textFiles || 0} text files`}
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

      {/* Move To Folder Modal */}
      <MoveToFolderModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onConfirm={confirmMove}
        photos={photos}
        folders={folders}
        selectedItems={selectedItems}
        onFolderCreated={loadPhotos}
        rootFolder={rootFolder}
      />

      {/* Copy To Folder Modal */}
      <MoveToFolderModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onConfirm={confirmCopy}
        photos={photos}
        folders={folders}
        selectedItems={selectedItems}
        onFolderCreated={loadPhotos}
        rootFolder={rootFolder}
        title="ui.copyItems"
        buttonText="ui.copyHere"
      />

      {/* Create Object Modal */}
      <CreateObjectModal
        isOpen={showCreateObjectModal}
        onClose={() => setShowCreateObjectModal(false)}
        onConfirm={confirmCreateObject}
        selectedPhotos={
          selectedItems
            .filter(id => id.startsWith('photo-'))
            .map(id => photos.find(p => p.id === parseInt(id.replace('photo-', ''))))
            .filter(Boolean)
        }
        selectedTextFiles={
          selectedItems
            .filter(id => id.startsWith('textfile-'))
            .map(id => textFiles.find(tf => tf.id === parseInt(id.replace('textfile-', ''))))
            .filter(Boolean)
        }
        currentFolderName={currentFolderInfo?.name || ''}
        categories={categories}
      />

      {/* Text File Edit Modal */}
      {editingTextFile && (
        <TextFileEdit
          textFile={editingTextFile}
          onClose={() => setEditingTextFile(null)}
          onSaved={async () => {
            await loadPhotos()
            setEditingTextFile(null)
          }}
        />
      )}
    </div>
  )
}
