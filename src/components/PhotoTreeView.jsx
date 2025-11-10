import { useMemo } from 'react'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useLanguage } from '../contexts/LanguageContext'
import { Menu, Item, useContextMenu } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

const PHOTO_MENU_ID = 'photo-context-menu'
const FOLDER_MENU_ID = 'folder-context-menu'

export default function PhotoTreeView({ photos, folders = [], onPhotoClick, selectedItems = [], onToggleSelect, currentPath = [], onPathChange, onSelectAll, onEditPhoto, onDeleteItems, onMoveItems }) {
  const { t } = useLanguage()

  const { show: showPhotoMenu } = useContextMenu({ id: PHOTO_MENU_ID })
  const { show: showFolderMenu } = useContextMenu({ id: FOLDER_MENU_ID })

  // Find common prefix of all paths (common root)
  const commonRoot = useMemo(() => {
    if (photos.length === 0) return ''

    const paths = photos.map(p => p.original_path.split('/').filter(part => part !== ''))

    if (paths.length === 1) {
      // Single photo, return its parent folder
      const pathParts = [...paths[0]]
      pathParts.pop() // Remove file name
      return pathParts
    }

    // Find common prefix
    let commonParts = paths[0]
    for (let i = 1; i < paths.length; i++) {
      const currentPath = paths[i]
      const newCommon = []

      for (let j = 0; j < Math.min(commonParts.length, currentPath.length - 1); j++) {
        if (commonParts[j] === currentPath[j]) {
          newCommon.push(commonParts[j])
        } else {
          break
        }
      }

      commonParts = newCommon
      if (commonParts.length === 0) break
    }

    return commonParts
  }, [photos])

  // Organize photos by folders (relative to common root)
  const fileTree = useMemo(() => {
    const tree = { folders: {}, photos: [] }

    console.log('PhotoTreeView: Building tree with', folders.length, 'folders and', photos.length, 'photos')
    console.log('PhotoTreeView: commonRoot is', commonRoot)

    // First, add all folders from file system
    folders.forEach(folder => {
      const pathParts = folder.path.split('/').filter(part => part !== '')
      const relativeParts = pathParts.slice(commonRoot.length)

      if (relativeParts.length === 0) return // Skip root

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
    })

    // Then, add photos to their respective folders
    photos.forEach(photo => {
      const pathParts = photo.original_path.split('/').filter(part => part !== '')
      const fileName = pathParts.pop()

      // Remove common prefix
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

    console.log('PhotoTreeView: Built tree with', Object.keys(tree.folders).length, 'root folders')
    return tree
  }, [photos, folders, commonRoot])

  // Navigate tree
  const getCurrentFolder = () => {
    let current = fileTree
    currentPath.forEach(folderName => {
      current = current.folders[folderName]
    })
    return current
  }

  const currentFolder = getCurrentFolder()
  const folderEntries = Object.entries(currentFolder.folders)

  // Check if all elements in current folder are selected
  const areAllSelected = () => {
    if (folderEntries.length === 0 && currentFolder.photos.length === 0) {
      return false
    }

    const allFolderIds = folderEntries.map(([_, folder]) => `folder-${folder.fullPath}`)
    const allPhotoIds = currentFolder.photos.map(photo => `photo-${photo.id}`)
    const allIds = [...allFolderIds, ...allPhotoIds]

    return allIds.length > 0 && allIds.every(id => selectedItems.includes(id))
  }

  // Handle selection of entire folder
  const handleFolderSelect = (folderName) => {
    const folder = currentFolder.folders[folderName]
    const allPhotosInFolder = getAllPhotosInFolder(folder)

    // Use full folder path (with commonRoot)
    const fullFolderPath = folder.fullPath

    // Check if all items are selected
    const allSelected = allPhotosInFolder.every(p => selectedItems.includes(`photo-${p.id}`)) &&
      selectedItems.includes(`folder-${fullFolderPath}`)

    if (allSelected) {
      // Deselect all
      onToggleSelect(`folder-${fullFolderPath}`, 'deselect-all', allPhotosInFolder)
    } else {
      // Select all
      onToggleSelect(`folder-${fullFolderPath}`, 'select-all', allPhotosInFolder)
    }
  }

  const getAllPhotosInFolder = (folder) => {
    let photos = [...folder.photos]
    Object.values(folder.folders).forEach(subFolder => {
      photos = photos.concat(getAllPhotosInFolder(subFolder))
    })
    return photos
  }

  const isFolderSelected = (folderName) => {
    const folder = currentFolder.folders[folderName]
    return selectedItems.includes(`folder-${folder.fullPath}`)
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

  const handleFolderContextMenu = (event, folderName, folder) => {
    event.preventDefault()
    showFolderMenu({
      event,
      props: { folderName, folder }
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
      onDeleteItems([`folder-${props.folder.fullPath}`])
    }
  }

  const handlePhotoMove = ({ props }) => {
    if (props.photo && onMoveItems) {
      onMoveItems([`photo-${props.photo.id}`])
    }
  }

  const handleFolderMove = ({ props }) => {
    if (props.folder && onMoveItems) {
      onMoveItems([`folder-${props.folder.fullPath}`])
    }
  }

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
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4 text-sm bg-gray-50 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPathChange([])}
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            {t('ui.root')}
          </button>
          {currentPath.map((folder, index) => (
            <div key={index} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button
                onClick={() => onPathChange(currentPath.slice(0, index + 1))}
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {folder}
              </button>
            </div>
          ))}
        </div>

        {/* Select all / Deselect all button */}
        {(folderEntries.length > 0 || currentFolder.photos.length > 0) && onSelectAll && (
          <button
            onClick={onSelectAll}
            className={`px-3 py-1 text-white text-xs rounded transition-colors whitespace-nowrap ${
              areAllSelected()
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {areAllSelected() ? t('ui.deselectAll') : t('ui.selectAll')}
          </button>
        )}
      </div>

      {/* Folders list */}
      {folderEntries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 px-2">{t('ui.folders')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {folderEntries.map(([folderName, folder]) => {
              const photoCount = getAllPhotosInFolder(folder).length
              const selected = isFolderSelected(folderName)

              return (
                <div
                  key={folderName}
                  className={`relative group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-2 ${
                    selected ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                  }`}
                  onContextMenu={(e) => handleFolderContextMenu(e, folderName, folder)}
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleFolderSelect(folderName)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>

                  {/* Folder icon and name */}
                  <div
                    className="cursor-pointer"
                    onClick={() => onPathChange([...currentPath, folderName])}
                  >
                    <div className="flex justify-center mb-2">
                      <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate text-center" title={folderName}>
                      {folderName}
                    </p>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      {photoCount} photo{photoCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
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
