import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { settingsAPI } from './api'
import Sidebar from './components/Sidebar'
import ObjectList from './components/ObjectList'
import PhotoManager from './components/PhotoManager'
import PhotoImport from './components/PhotoImport'
import Categories from './components/Categories'
import PlatformList from './components/PlatformList'
import Sales from './components/Sales'
import UpdateModal from './components/UpdateModal'
import WelcomeModal from './components/WelcomeModal'
import UserSettings from './components/UserSettings'
import Documentation from './components/Documentation'

function AppContent() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('objects-list')
  const [updateInfo, setUpdateInfo] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateCheckStatus, setUpdateCheckStatus] = useState(null) // null, true (update available), false (up to date)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Check if welcome modal should be shown
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const welcomeCompleted = await settingsAPI.get('welcome_completed')
        if (!welcomeCompleted) {
          setShowWelcome(true)
        }
      } catch (error) {
        console.error('Error checking welcome status:', error)
        // On error, show welcome modal to be safe
        setShowWelcome(true)
      }
    }

    checkWelcomeStatus()
  }, [])

  const getPageTitle = () => {
    switch (activeTab) {
      case 'objects-list':
        return t('objects.title')
      case 'objects-categories':
        return t('categories.title')
      case 'photos-import':
        return t('photos.importTitle')
      case 'photos-collection':
        return t('photos.title')
      case 'platforms-list':
        return t('platforms.title')
      case 'platforms-sales':
        return t('platforms.salesTitle')
      case 'documentation':
        return t('sidebar.documentation')
      case 'user-settings':
        return t('user.settings')
      default:
        return t('interface.sellerLibraryName')
    }
  }

  const getPageDescription = () => {
    switch (activeTab) {
      case 'objects-list':
        return t('objects.description')
      case 'objects-categories':
        return t('categories.description')
      case 'photos-import':
        return t('photos.importDescription')
      case 'photos-collection':
        return t('photos.description')
      case 'platforms-list':
        return t('platforms.description')
      case 'platforms-sales':
        return t('platforms.salesDescription')
      case 'documentation':
        return t('documentation.intro')
      case 'user-settings':
        return t('user.settingsDescription')
      default:
        return ''
    }
  }

  // Function to check for updates
  const checkForUpdates = async () => {
    try {
      const update = await invoke('check_for_updates')
      if (update) {
        setUpdateInfo(update)
        setUpdateCheckStatus(true)
      } else {
        setUpdateCheckStatus(false)
      }
    } catch (error) {
      console.error('Update check failed:', error)
      // In case of error, do nothing (silent)
      setUpdateCheckStatus(null)
    }
  }

  // Check at launch and every 30 minutes
  useEffect(() => {
    // Check at launch
    checkForUpdates()

    // Check every 30 minutes (1800000 ms)
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const handleUpdateClick = async () => {
    setShowUpdateModal(true)
    setIsCheckingUpdate(true)
    setUpdateInfo(null)

    // Launch the check
    try {
      const update = await invoke('check_for_updates')
      if (update) {
        setUpdateInfo(update)
        setUpdateCheckStatus(true)
      } else {
        setUpdateCheckStatus(false)
      }
    } catch (error) {
      console.error('Update check failed:', error)
      setUpdateCheckStatus(null)
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        updateAvailable={updateCheckStatus}
        onUpdateClick={handleUpdateClick}
      />

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
          {activeTab === 'documentation' && <Documentation />}
          {activeTab === 'user-settings' && <UserSettings />}
        </main>
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal onComplete={() => setShowWelcome(false)} />
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateModal
          updateInfo={updateInfo}
          onClose={handleCloseUpdateModal}
          isChecking={isCheckingUpdate}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
