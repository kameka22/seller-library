import { useState, useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { photosAPI } from '../utils/api'

export default function MoveToFolderModal({ isOpen, onClose, onConfirm, photos, selectedItems, onFolderCreated }) {
  const { t } = useLanguage()
  const [currentPath, setCurrentPath] = useState([])
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedDestination, setSelectedDestination] = useState(null)

  // Build folder tree from photos
  const folderTree = useMemo(() => {
    if (!photos || photos.length === 0) return { folders: {}, photos: [] }

    // Find common root
    const paths = photos.map(p => p.original_path.split('/').filter(part => part !== ''))
    let commonRoot = []

    if (paths.length > 0) {
      commonRoot = paths[0]
      for (let i = 1; i < paths.length; i++) {
        const currentPath = paths[i]
        const newCommon = []
        for (let j = 0; j < Math.min(commonRoot.length, currentPath.length - 1); j++) {
          if (commonRoot[j] === currentPath[j]) {
            newCommon.push(commonRoot[j])
          } else {
            break
          }
        }
        commonRoot = newCommon
      }
    }

    // Build tree
    const tree = { folders: {}, photos: [], commonRoot }

    photos.forEach(photo => {
      const pathParts = photo.original_path.split('/').filter(part => part !== '')
      const fileName = pathParts.pop()
      const relativeParts = pathParts.slice(commonRoot.length)

      let current = tree
      relativeParts.forEach((part, index) => {
        if (!current.folders[part]) {
          current.folders[part] = {
            folders: {},
            photos: [],
            fullPath: [...commonRoot, ...relativeParts.slice(0, index + 1)].join('/'),
            name: part
          }
        }
        current = current.folders[part]
      })

      current.photos.push({ ...photo, fileName })
    })

    return tree
  }, [photos])

  // Navigate to current folder
  const getCurrentFolder = () => {
    let current = folderTree
    currentPath.forEach((folderName, index) => {
      // Create folder if it doesn't exist (for newly created folders)
      if (!current.folders[folderName]) {
        const pathSoFar = currentPath.slice(0, index + 1)
        current.folders[folderName] = {
          folders: {},
          photos: [],
          fullPath: [...folderTree.commonRoot, ...pathSoFar].join('/'),
          name: folderName
        }
      }
      current = current.folders[folderName]
    })
    return current
  }

  const currentFolder = getCurrentFolder()
  const folderEntries = Object.entries(currentFolder.folders || {})

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      // Build the full path for the new folder
      const fullPath = [...folderTree.commonRoot, ...currentPath, newFolderName].join('/')

      // Create folder on file system immediately
      await photosAPI.createFolder('/' + fullPath)

      // Notify parent to reload photos
      if (onFolderCreated) {
        await onFolderCreated()
      }

      // Navigate to the new folder after creation
      setCurrentPath([...currentPath, newFolderName])
      setIsCreatingFolder(false)
      setNewFolderName('')
    } catch (err) {
      console.error('Error creating folder:', err)
      alert(t('ui.moveError') + ': ' + (err.message || err))
    }
  }

  const handleNavigateToFolder = (folderName) => {
    setCurrentPath([...currentPath, folderName])
  }

  const handleNavigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
    }
  }

  const handleConfirm = () => {
    // Use current path as destination
    const fullPath = [...folderTree.commonRoot, ...currentPath].join('/')
    if (fullPath) {
      onConfirm('/' + fullPath)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('ui.moveItems')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('ui.selectDestination')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Current Path Breadcrumb */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setCurrentPath([])}
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              {t('ui.root')}
            </button>
            {currentPath.map((folder, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <button
                  onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {folder}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Folder list */}
          {folderEntries.length > 0 ? (
            <div className="space-y-2">
              {folderEntries.map(([folderName, folder]) => {
                return (
                  <button
                    key={folderName}
                    onClick={() => handleNavigateToFolder(folderName)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span className="flex-1 font-medium text-gray-900">{folderName}</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t('ui.noSubfolders')}</p>
            </div>
          )}

          {/* Create new folder */}
          <div className="mt-4 pt-4 border-t">
            {isCreatingFolder ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  placeholder={t('placeholders.folderName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {t('common.create')}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingFolder(false)
                      setNewFolderName('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('ui.createNewFolder')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={currentPath.length === 0}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('ui.moveHere')}
          </button>
        </div>
      </div>
    </div>
  )
}
