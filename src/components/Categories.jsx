import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import ConfirmModal from './ConfirmModal'
import { useLanguage } from '../contexts/LanguageContext'

export default function Categories() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await invoke('list_categories')
      setCategories(data)
      setError(null)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError(t('errors.loadingCategories'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      await invoke('create_category', { category: { name: newCategoryName.trim() } })
      setNewCategoryName('')
      await loadCategories()
    } catch (err) {
      console.error('Error creating category:', err)
      setError(t('errors.creatingCategory'))
    }
  }

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      await invoke('delete_category', { id: categoryToDelete.id })
      await loadCategories()
      setShowDeleteModal(false)
      setCategoryToDelete(null)
    } catch (err) {
      console.error('Error deleting category:', err)
      setError(t('errors.deletingCategory'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('categories.newCategory')}
        </h2>
        <form onSubmit={handleCreateCategory} className="flex gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={t('placeholders.categoryName')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {t('common.add')}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('categories.title')} ({categories.length})
          </h2>

          {categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="mt-2">{t('categories.noCategories')}</p>
              <p className="text-sm mt-1">{t('categories.startAdding')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title={t('common.delete')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setCategoryToDelete(null)
        }}
        onConfirm={confirmDelete}
        title={t('ui.confirmDeletion')}
        message={`${t('categories.deleteConfirm')} "${categoryToDelete?.name}" ?`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        danger={true}
      />
    </div>
  )
}
