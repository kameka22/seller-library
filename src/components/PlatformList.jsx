import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import PlatformCard from './PlatformCard'
import PlatformDetail from './PlatformDetail'
import CreatePlatformForm from './CreatePlatformForm'
import SlidePanel from './SlidePanel'
import ConfirmModal from './ConfirmModal'
import { useLanguage } from '../contexts/LanguageContext'

export default function PlatformList() {
  const { t } = useLanguage()
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [platformToDelete, setPlatformToDelete] = useState(null)

  useEffect(() => {
    loadPlatforms()
  }, [])

  const loadPlatforms = async () => {
    try {
      setLoading(true)
      const data = await invoke('list_platforms')
      setPlatforms(data)
      setError(null)
    } catch (err) {
      console.error('Error loading platforms:', err)
      setError(t('errors.loadingPlatforms'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (platform) => {
    setPlatforms([...platforms, platform])
    setShowCreatePanel(false)
  }

  const handleUpdate = (updated) => {
    setPlatforms(platforms.map(p => p.id === updated.id ? updated : p))
    setSelectedPlatform(updated)
  }

  const handleDeleteRequest = () => {
    setPlatformToDelete(selectedPlatform)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!platformToDelete) return

    try {
      await invoke('delete_platform', { id: platformToDelete.id })
      setPlatforms(platforms.filter(p => p.id !== platformToDelete.id))
      setSelectedPlatform(null)
      setShowDeleteConfirm(false)
      setPlatformToDelete(null)
    } catch (error) {
      console.error('Error deleting platform:', error)
      alert(t('errors.deletingObject'))
    }
  }

  const filteredPlatforms = platforms.filter(platform => {
    const matchesSearch = platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (platform.base_url && platform.base_url.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Add Button */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder={t('placeholders.platformSearch')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowCreatePanel(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          + {t('ui.newPlatform')}
        </button>
      </div>

      {/* Platforms Grid */}
      {filteredPlatforms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery
            ? t('ui.noPlatformFound')
            : t('ui.noPlatformCreate')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              onClick={setSelectedPlatform}
            />
          ))}
        </div>
      )}

      {/* Create Panel */}
      <SlidePanel
        isOpen={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title={t('ui.newPlatform')}
      >
        <CreatePlatformForm
          onSuccess={handleCreate}
          onCancel={() => setShowCreatePanel(false)}
        />
      </SlidePanel>

      {/* Detail Panel */}
      <SlidePanel
        isOpen={!!selectedPlatform}
        onClose={() => setSelectedPlatform(null)}
        title={selectedPlatform?.name || ''}
      >
        {selectedPlatform && (
          <PlatformDetail
            platform={selectedPlatform}
            onClose={() => setSelectedPlatform(null)}
            onUpdate={handleUpdate}
            onDeleteRequest={handleDeleteRequest}
          />
        )}
      </SlidePanel>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setPlatformToDelete(null)
        }}
        onConfirm={handleDelete}
        title={t('ui.deletePlatform')}
        message={`${t('platforms.deleteConfirm')} "${platformToDelete?.name}" ? ${t('platforms.deleteMessage')}`}
        confirmText={t('common.delete')}
        confirmStyle="danger"
      />
    </div>
  )
}
