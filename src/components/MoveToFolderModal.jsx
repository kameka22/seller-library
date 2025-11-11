import { useState, useMemo, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { photosAPI } from '../utils/api'

export default function MoveToFolderModal({ isOpen, onClose, onConfirm, photos, folders = [], selectedItems, onFolderCreated }) {
  const { t } = useLanguage()
  const [currentFolderId, setCurrentFolderId] = useState(null) // null = root
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentFolderId(null)
      setIsCreatingFolder(false)
      setNewFolderName('')
    }
  }, [isOpen])

  // Build folder map with parent-child relationships
  const folderMap = useMemo(() => {
    const map = new Map()
    folders.forEach(folder => {
      map.set(folder.id, {
        ...folder,
        children: []
      })
    })

    // Build parent-child relationships
    folders.forEach(folder => {
      if (folder.parent_id !== null && map.has(folder.parent_id)) {
        const parent = map.get(folder.parent_id)
        parent.children.push(folder.id)
      }
    })

    return map
  }, [folders])

  // Get root folders (folders with parent_id = null)
  const rootFolders = useMemo(() => {
    return folders
      .filter(f => f.parent_id === null)
      .map(f => folderMap.get(f.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [folders, folderMap])

  // Get current folder data
  const currentFolder = useMemo(() => {
    if (currentFolderId === null) {
      // At root level
      return {
        id: null,
        name: t('ui.root'),
        path: '/',
        children: rootFolders
      }
    }

    const folder = folderMap.get(currentFolderId)
    if (!folder) {
      return {
        id: null,
        name: t('ui.root'),
        path: '/',
        children: rootFolders
      }
    }

    return {
      ...folder,
      children: folder.children.map(id => folderMap.get(id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
    }
  }, [currentFolderId, folderMap, rootFolders, t])

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      // Build the full path for the new folder
      const parentPath = currentFolder.path === '/' ? '' : currentFolder.path
      const newFolderPath = `${parentPath}/${newFolderName.trim()}`

      await photosAPI.createFolder(newFolderPath)

      // Notify parent to reload folders
      if (onFolderCreated) {
        await onFolderCreated()
      }

      setIsCreatingFolder(false)
      setNewFolderName('')
    } catch (err) {
      console.error('Error creating folder:', err)
    }
  }

  const handleConfirm = () => {
    if (currentFolder.id === null) {
      // Cannot move to root
      return
    }

    onConfirm(currentFolder.path)
    onClose()
  }

  const canMoveToCurrentFolder = () => {
    // Cannot move to root
    if (currentFolderId === null) {
      return false
    }

    // Check if trying to move a folder into itself or its descendants
    const movingFolders = selectedItems.filter(id => id.startsWith('folder-'))

    for (const folderId of movingFolders) {
      const folderPath = folderId.replace('folder-', '')

      // Check if current folder is the same or a child of the moving folder
      let checkFolderId = currentFolderId
      while (checkFolderId !== null) {
        const checkFolder = folderMap.get(checkFolderId)
        if (!checkFolder) break

        if (checkFolder.path === folderPath) {
          return false // Cannot move folder into itself or its descendant
        }

        checkFolderId = checkFolder.parent_id
      }
    }

    return true
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">{t('ui.moveItems')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('ui.selectDestination')}</p>
        </div>

        {/* Breadcrumb */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              {t('ui.root')}
            </button>
            {breadcrumb.map((folder) => (
              <div key={folder.id} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Folders Grid */}
          {currentFolder.children.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentFolder.children.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-12 h-12 text-blue-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 truncate w-full text-center" title={folder.name}>
                    {folder.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">{t('ui.noSubfolders')}</p>
            </div>
          )}

          {/* Create Folder Section */}
          {!isCreatingFolder ? (
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">{t('ui.createNewFolder')}</span>
            </button>
          ) : (
            <div className="mt-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                  if (e.key === 'Escape') {
                    setIsCreatingFolder(false)
                    setNewFolderName('')
                  }
                }}
                placeholder={t('ui.createNewFolder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {currentFolderId !== null && (
              <span>
                <span className="font-medium">{t('ui.destination')}:</span> {currentFolder.path}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canMoveToCurrentFolder()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('ui.moveHere')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
