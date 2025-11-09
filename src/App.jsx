import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ObjectList from './components/ObjectList'
import PhotoManager from './components/PhotoManager'
import PhotoImport from './components/PhotoImport'
import Categories from './components/Categories'
import PlatformList from './components/PlatformList'
import Sales from './components/Sales'

function App() {
  const [activeTab, setActiveTab] = useState('objects-list')

  const getPageTitle = () => {
    switch (activeTab) {
      case 'objects-list':
        return 'Mes Objets'
      case 'objects-categories':
        return 'Catégories'
      case 'photos-import':
        return 'Import de Photos'
      case 'photos-collection':
        return 'Collection de Photos'
      case 'platforms-list':
        return 'Plateformes de Vente'
      case 'platforms-sales':
        return 'Ventes'
      default:
        return 'Seller Library'
    }
  }

  const getPageDescription = () => {
    switch (activeTab) {
      case 'objects-list':
        return 'Gérez vos objets à vendre'
      case 'objects-categories':
        return 'Gérez vos catégories d\'objets'
      case 'photos-import':
        return 'Importez des photos depuis vos dossiers'
      case 'photos-collection':
        return 'Organisez vos photos'
      case 'platforms-list':
        return 'Configurez vos connexions aux plateformes de vente'
      case 'platforms-sales':
        return 'Consultez vos ventes sur toutes les plateformes'
      default:
        return ''
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {getPageDescription()}
            </p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'objects-list' && <ObjectList />}
          {activeTab === 'objects-categories' && <Categories />}
          {activeTab === 'photos-import' && <PhotoImport />}
          {activeTab === 'photos-collection' && <PhotoManager />}
          {activeTab === 'platforms-list' && <PlatformList />}
          {activeTab === 'platforms-sales' && <Sales />}
        </main>
      </div>
    </div>
  )
}

export default App
