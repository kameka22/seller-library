import { useMemo } from 'react'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useLanguage } from '../contexts/LanguageContext'
import { Menu, Item, useContextMenu } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

const PHOTO_MENU_ID = 'photo-context-menu'
const FOLDER_MENU_ID = 'folder-context-menu'

export default function PhotoTreeView({
  photos,
  folders = [],            // Filtered folders to display
  onPhotoClick,
  selectedItems = [],
  onToggleSelect,
  currentFolderId = null,  // Now using folder ID instead of path array
  onFolderChange,          // Changed from onPathChange
  onSelectAll,
  onEditPhoto,
  onDeleteItems,
  onMoveItems,
  onCopyItems,
  rootFolder = null,       // Root folder path to display real name
  allFolders = [],         // All folders for navigation and counts
  allPhotos = []           // All photos for counting (not filtered)
}) {
  const { t } = useLanguage()

  // Get root folder name from path
  const rootFolderName = useMemo(() => {
    if (!rootFolder) return t('ui.root')
    const parts = rootFolder.split('/').filter(p => p)
    return parts[parts.length - 1] || t('ui.root')
  }, [rootFolder, t])

  const { show: showPhotoMenu } = useContextMenu({ id: PHOTO_MENU_ID })
  const { show: showFolderMenu } = useContextMenu({ id: FOLDER_MENU_ID })

  // Build folder tree structure based on parent_id relationships using allFolders
  const folderMap = useMemo(() => {
    const map = new Map()
    const foldersToUse = allFolders.length > 0 ? allFolders : folders

    foldersToUse.forEach(folder => {
      map.set(folder.id, {
        ...folder,
        children: [],
        photoCount: 0
      })
    })

    // Build parent-child relationships
    foldersToUse.forEach(folder => {
      if (folder.parent_id !== null && map.has(folder.parent_id)) {
        const parent = map.get(folder.parent_id)
        parent.children.push(folder.id)
      }
    })

    // Count photos in each folder (including subfolders)
    // Use allPhotos for accurate counts, not filtered photos
    const photosToCount = allPhotos.length > 0 ? allPhotos : photos
    const countPhotos = (folderId) => {
      const folder = map.get(folderId)
      if (!folder) return 0

      let count = photosToCount.filter(p => p.folder_id === folderId).length
      folder.children.forEach(childId => {
        count += countPhotos(childId)
      })
      folder.photoCount = count
      return count
    }

    foldersToUse.forEach(folder => countPhotos(folder.id))

    return map
  }, [allFolders, folders, photos, allPhotos])

  // Get root folders (folders with parent_id = null) - use filtered folders for display
  const rootFolders = useMemo(() => {
    return folders
      .filter(f => f.parent_id === null)
      .map(f => folderMap.get(f.id))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [folders, folderMap])

  // Get current folder data
  const currentFolder = useMemo(() => {
    if (currentFolderId === null) {
      // At root level
      return {
        id: null,
        name: t('ui.root'),
        children: rootFolders,
        photos: photos.filter(p => p.folder_id === null)
      }
    }

    const folder = folderMap.get(currentFolderId)
    if (!folder) {
      return {
        id: null,
        name: t('ui.root'),
        children: rootFolders,
        photos: photos.filter(p => p.folder_id === null)
      }
    }

    // Filter children to show only folders that match the search (are in folders prop)
    const folderIds = new Set(folders.map(f => f.id))
    const filteredChildren = folder.children
      .map(id => folderMap.get(id))
      .filter(child => child && folderIds.has(child.id))
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      ...folder,
      children: filteredChildren,
      photos: photos.filter(p => p.folder_id === currentFolderId)
    }
  }, [currentFolderId, folderMap, rootFolders, photos, folders, t])

  // Build breadcrumb trail
  const breadcrumb = useMemo(() => {
    const trail = []
    let folderId = currentFolderId

    while (folderId !== null) {
      const folder = folderMap.get(folderId)
      if (!folder) break
      trail.unshift(folder)
      folderId = folder.parent_id
    }

    return trail
  }, [currentFolderId, folderMap])

  // Check if all elements in current folder are selected
  const areAllSelected = () => {
    // Exclude level 1 folders (parent_id === null) from selection
    const folderIds = currentFolder.children
      .filter(f => f.parent_id !== null)
      .map(f => `folder-${f.path}`)
    const photoIds = currentFolder.photos.map(p => `photo-${p.id}`)
    const allIds = [...folderIds, ...photoIds]

    return allIds.length > 0 && allIds.every(id => selectedItems.includes(id))
  }

  // Get all photos in a folder recursively
  const getAllPhotosInFolder = (folderId) => {
    let allPhotos = photos.filter(p => p.folder_id === folderId)

    const folder = folderMap.get(folderId)
    if (folder) {
      folder.children.forEach(childId => {
        allPhotos = allPhotos.concat(getAllPhotosInFolder(childId))
      })
    }

    return allPhotos
  }

  // Handle selection of entire folder
  const handleFolderSelect = (folder) => {
    const allPhotosInFolder = getAllPhotosInFolder(folder.id)
    const folderPath = folder.path

    // Check if all items are selected
    const allSelected = allPhotosInFolder.every(p => selectedItems.includes(`photo-${p.id}`)) &&
      selectedItems.includes(`folder-${folderPath}`)

    if (allSelected) {
      // Deselect all
      onToggleSelect(`folder-${folderPath}`, 'deselect-all', allPhotosInFolder)
    } else {
      // Select all
      onToggleSelect(`folder-${folderPath}`, 'select-all', allPhotosInFolder)
    }
  }

  const isFolderSelected = (folder) => {
    return selectedItems.includes(`folder-${folder.path}`)
  }

  const isPhotoSelected = (photoId) => {
    return selectedItems.includes(`photo-${photoId}`)
  }

  // Context menu handlers
  const handlePhotoContextMenu = (event, photo) => {
    event.preventDefault()
    showPhotoMenu({
      event,
      props: { photo }
    })
  }

  const handleFolderContextMenu = (event, folder) => {
    event.preventDefault()
    showFolderMenu({
      event,
      props: { folder }
    })
  }

  const handlePhotoEdit = ({ props }) => {
    if (props.photo && onEditPhoto) {
      onEditPhoto(props.photo)
    }
  }

  const handlePhotoDelete = ({ props }) => {
    if (props.photo && onDeleteItems) {
      onDeleteItems([`photo-${props.photo.id}`])
    }
  }

  const handleFolderDelete = ({ props }) => {
    if (props.folder && onDeleteItems) {
      onDeleteItems([`folder-${props.folder.path}`])
    }
  }

  const handlePhotoMove = ({ props }) => {
    if (props.photo && onMoveItems) {
      onMoveItems([`photo-${props.photo.id}`])
    }
  }

  const handlePhotoCopy = ({ props }) => {
    if (props.photo && onCopyItems) {
      onCopyItems([`photo-${props.photo.id}`])
    }
  }

  const handleFolderMove = ({ props }) => {
    if (props.folder && onMoveItems) {
      onMoveItems([`folder-${props.folder.path}`])
    }
  }

  // Only show "no photos in collection" message when at root and truly empty
  // Use allFolders and allPhotos to check if collection is really empty, not just current folder
  const photosToCheck = allPhotos.length > 0 ? allPhotos : photos
  const isCollectionEmpty = (allFolders.length > 0 ? allFolders : folders).length === 0 && photosToCheck.length === 0
  const isAtRoot = currentFolderId === null

  if (isCollectionEmpty && isAtRoot) {
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
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4 text-sm bg-gray-50 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFolderChange(null)}
            className="text-blue-600 hover:text-blue-700 hover:underline"
            title={rootFolder || t('ui.root')}
          >
            {rootFolderName}
          </button>
          {breadcrumb.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button
                onClick={() => onFolderChange(folder.id)}
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Folders list */}
      {currentFolder.children.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 px-2">{t('ui.folders')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentFolder.children.map((folder) => {
              const selected = isFolderSelected(folder)
              // Level 1 folders (parent_id === null) cannot be selected or have context menu
              const isLevel1 = folder.parent_id === null

              return (
                <div
                  key={folder.id}
                  className={`relative group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-2 ${
                    selected ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                  }`}
                  onContextMenu={(e) => {
                    if (!isLevel1) {
                      handleFolderContextMenu(e, folder)
                    }
                  }}
                >
                  {/* Selection checkbox - only for level 2+ folders */}
                  {!isLevel1 && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleFolderSelect(folder)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Folder icon and name */}
                  <div
                    className="cursor-pointer"
                    onClick={() => onFolderChange(folder.id)}
                  >
                    <div className="flex justify-center mb-2">
                      <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate text-center" title={folder.name}>
                      {folder.name}
                    </p>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      {folder.photoCount} photo{folder.photoCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty folder message */}
      {currentFolder.children.length === 0 && currentFolder.photos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="mt-4 text-sm">{t('ui.emptyFolder')}</p>
        </div>
      )}

      {/* Photos list */}
      {currentFolder.photos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 px-2">{t('ui.photos')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {currentFolder.photos.map((photo) => {
              const selected = isPhotoSelected(photo.id)
              // Add cache buster to force reload when photo is updated
              const cacheBuster = photo._cacheKey || Date.parse(photo.created_at)
              const imageSrc = `${convertFileSrc(photo.file_path)}?t=${cacheBuster}`

              return (
                <div
                  key={photo.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square ${
                    selected ? 'ring-4 ring-blue-500' : ''
                  }`}
                  onContextMenu={(e) => handlePhotoContextMenu(e, photo)}
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
                        checked={selected}
                        onChange={() => onToggleSelect(`photo-${photo.id}`)}
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
        </div>
      )}

      {/* Context Menus */}
      <Menu id={PHOTO_MENU_ID}>
        <Item onClick={handlePhotoEdit}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{t('photos.editPhoto')}</span>
          </div>
        </Item>
        <Item onClick={handlePhotoCopy}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{t('common.copy')}</span>
          </div>
        </Item>
        <Item onClick={handlePhotoMove}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>{t('common.move')}</span>
          </div>
        </Item>
        <Item onClick={handlePhotoDelete}>
          <div className="flex items-center gap-2 text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{t('common.delete')}</span>
          </div>
        </Item>
      </Menu>

      <Menu id={FOLDER_MENU_ID}>
        <Item onClick={handleFolderMove}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>{t('common.move')}</span>
          </div>
        </Item>
        <Item onClick={handleFolderDelete}>
          <div className="flex items-center gap-2 text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{t('common.delete')}</span>
          </div>
        </Item>
      </Menu>
    </div>
  )
}
