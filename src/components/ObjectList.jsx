import { useState, useEffect } from 'react'
import { objectsAPI } from '../api'
import { invoke } from '@tauri-apps/api/tauri'
import ObjectCard from './ObjectCard'
import ObjectDetail from './ObjectDetail'
import CreateObjectForm from './CreateObjectForm'
import SlidePanel from './SlidePanel'
import ConfirmModal from './ConfirmModal'
import { useLanguage } from '../contexts/LanguageContext'

export default function ObjectList() {
  const { t } = useLanguage()
  const [objects, setObjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [objectToDelete, setObjectToDelete] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadObjects()
    loadCategories()
  }, [])

  const loadObjects = async () => {
    try {
      setLoading(true)
      const data = await objectsAPI.list()
      setObjects(data)
      setError(null)
    } catch (err) {
      console.error('Error loading objects:', err)
      setError(t('errors.loadingObjects'))
    } finally {
      setLoading(false)
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

  const handleCreate = async (object) => {
    try {
      const created = await objectsAPI.create(object)
      setObjects([created, ...objects])
      setShowCreatePanel(false)
    } catch (err) {
      console.error('Error creating object:', err)
      alert(t('errors.creatingObject'))
    }
  }

  const handleUpdate = (updated) => {
    setObjects(objects.map(obj => obj.id === updated.id ? updated : obj))
    setSelectedObject(updated)
  }

  const handleDeleteRequest = () => {
    setObjectToDelete(selectedObject)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!objectToDelete) return

    try {
      await objectsAPI.delete(objectToDelete.id)
      setObjects(objects.filter(obj => obj.id !== objectToDelete.id))
      setSelectedObject(null)
      setObjectToDelete(null)
    } catch (error) {
      console.error('Error deleting object:', error)
      alert(t('errors.deletingObject'))
    }
  }

  const handleDelete = (id) => {
    setObjects(objects.filter(obj => obj.id !== id))
  }

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const filteredObjects = objects.filter(obj => {
    // Filter by search query
    const matchesSearch = obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (obj.description && obj.description.toLowerCase().includes(searchQuery.toLowerCase()))

    // Filter by selected categories
    const matchesCategory = selectedCategories.length === 0 ||
      (obj.category_id && selectedCategories.includes(obj.category_id))

    return matchesSearch && matchesCategory
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredObjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedObjects = filteredObjects.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategories, itemsPerPage])

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
          placeholder={t('placeholders.objectSearch')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowCreatePanel(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          + {t('ui.newObject')}
        </button>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium text-gray-700">{t('ui.filterByCategory')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategories.includes(category.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                ✕ {t('ui.clearFilters')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Objects Grid */}
      {filteredObjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery || selectedCategories.length > 0
            ? t('ui.noObjectFound')
            : t('ui.noObjectCreate')}
        </div>
      ) : (
        <>
          {/* Results info and items per page selector */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="text-sm text-gray-600">
              {t('ui.showingResults', { start: startIndex + 1, end: Math.min(endIndex, filteredObjects.length), total: filteredObjects.length })}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{t('pagination.itemsPerPage')} :</label>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-gray-700 font-medium shadow-sm hover:border-gray-400 transition-colors text-sm"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Objects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedObjects.map((object) => (
              <ObjectCard
                key={`${object.id}-${refreshKey}`}
                object={object}
                onClick={setSelectedObject}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('ui.previous')}
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1
                  // Show first page, last page, current page, and pages around current
                  const showPage = pageNumber === 1 ||
                                   pageNumber === totalPages ||
                                   (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)

                  // Show ellipsis
                  const showEllipsisBefore = pageNumber === currentPage - 2 && currentPage > 3
                  const showEllipsisAfter = pageNumber === currentPage + 2 && currentPage < totalPages - 2

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return <span key={pageNumber} className="px-2 text-gray-400">...</span>
                  }

                  if (!showPage) return null

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`min-w-[2.5rem] px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('ui.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Panel */}
      <SlidePanel
        isOpen={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title={t('ui.newObject')}
      >
        <CreateObjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreatePanel(false)}
          categories={categories}
        />
      </SlidePanel>

      {/* Detail Panel */}
      <SlidePanel
        isOpen={!!selectedObject}
        onClose={() => setSelectedObject(null)}
        title={selectedObject?.name || ''}
      >
        {selectedObject && (
          <ObjectDetail
            object={selectedObject}
            onClose={() => setSelectedObject(null)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onDeleteRequest={handleDeleteRequest}
            onPhotoUpdate={() => setRefreshKey(prev => prev + 1)}
            categories={categories}
          />
        )}
      </SlidePanel>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title={t('ui.deleteObject')}
        message={`${t('objects.deleteConfirm')} "${objectToDelete?.name}" ?\n\n${t('objects.deleteMessage')}`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        danger={true}
      />
    </div>
  )
}
