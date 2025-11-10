import { useState, useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function MoveToFolderModal({ isOpen, onClose, onConfirm, photos, selectedItems }) {
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
    currentPath.forEach(folderName => {
      current = current.folders[folderName]
    })
    return current
  }

  const currentFolder = getCurrentFolder()
  const folderEntries = Object.entries(currentFolder.folders || {})

  // Handle folder creation
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return

    const fullPath = [...folderTree.commonRoot, ...currentPath, newFolderName].join('/')
    setSelectedDestination('/' + fullPath)
    setIsCreatingFolder(false)
    setNewFolderName('')
  }

  const handleSelectFolder = (folderPath) => {
    setSelectedDestination('/' + folderPath)
  }

  const handleNavigateToFolder = (folderName) => {
    setCurrentPath([...currentPath, folderName])
    setSelectedDestination(null)
  }

  const handleNavigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
      setSelectedDestination(null)
    }
  }

  const handleSelectCurrent = () => {
    const fullPath = [...folderTree.commonRoot, ...currentPath].join('/')
    setSelectedDestination('/' + fullPath)
  }

  const handleConfirm = () => {
    if (selectedDestination) {
      onConfirm(selectedDestination)
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
          {/* Select current folder button */}
          <button
            onClick={handleSelectCurrent}
            className={`w-full p-3 mb-3 rounded-lg border-2 text-left transition-colors ${
              selectedDestination === '/' + [...folderTree.commonRoot, ...currentPath].join('/')
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="font-medium text-gray-900">
                {t('ui.currentFolder')}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 ml-7">
              /{[...folderTree.commonRoot, ...currentPath].join('/')}
            </div>
          </button>

          {/* Folder list */}
          {folderEntries.length > 0 ? (
            <div className="space-y-2">
              {folderEntries.map(([folderName, folder]) => {
                const isSelected = selectedDestination === '/' + folder.fullPath
                return (
                  <div
                    key={folderName}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => handleNavigateToFolder(folderName)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <span className="font-medium text-gray-900">{folderName}</span>
                    </button>
                    <button
                      onClick={() => handleSelectFolder(folder.fullPath)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {isSelected ? t('ui.selected') : t('ui.select')}
                    </button>
                  </div>
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

        {/* Selected destination info */}
        {selectedDestination && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{t('ui.destination')}:</span>{' '}
              <span className="text-blue-700">{selectedDestination}</span>
            </p>
          </div>
        )}

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
            disabled={!selectedDestination}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('ui.moveHere')}
          </button>
        </div>
      </div>
    </div>
  )
}
