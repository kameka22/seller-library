import { useState, useEffect } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { invoke } from '@tauri-apps/api/tauri'
import Stepper from './Stepper'
import { useLanguage } from '../contexts/LanguageContext'
import { photosAPI } from '../utils/api'

const getSteps = (t) => [
  { id: 1, label: t('photoImport.device') },
  { id: 2, label: t('photoImport.destination') },
  { id: 3, label: t('photoImport.description') },
  { id: 4, label: t('photoImport.importStep') }
]

export default function PhotoImport() {
  const { t } = useLanguage()
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const [unlockedSteps, setUnlockedSteps] = useState(new Set([1]))

  // Step 1: Device Selection
  const [volumes, setVolumes] = useState([])
  const [selectedVolume, setSelectedVolume] = useState(null)
  const [photoURLs, setPhotoURLs] = useState([])
  const [previewImages, setPreviewImages] = useState([])
  const [isScanning, setIsScanning] = useState(false)

  // Step 2: Destination
  const [destinationOption, setDestinationOption] = useState('import') // 'import' or 'other'
  const [importFolder, setImportFolder] = useState('') // Path to <root>/imports
  const [destinationFolder, setDestinationFolder] = useState('')
  const [folderFormatOption, setFolderFormatOption] = useState('automatic') // 'automatic' or 'custom'
  const [customFolderName, setCustomFolderName] = useState('')

  // Step 3: Description
  const [photoDescription, setPhotoDescription] = useState('')

  // Step 4: Import
  const [deleteAfterImport, setDeleteAfterImport] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [importLog, setImportLog] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)

  // Load volumes and import folder on mount
  useEffect(() => {
    loadVolumes()
    loadImportFolder()
  }, [])

  const loadImportFolder = async () => {
    try {
      const rootFolder = await photosAPI.getRootFolder()
      if (rootFolder) {
        const importPath = `${rootFolder}/imports`
        setImportFolder(importPath)
        setDestinationFolder(importPath) // Set as default
      }
    } catch (error) {
      console.error('Error loading import folder:', error)
    }
  }

  const loadVolumes = async () => {
    try {
      const detectedVolumes = await invoke('list_volumes')
      setVolumes(detectedVolumes)
    } catch (error) {
      console.error('Error loading volumes:', error)
    }
  }

  const handleVolumeSelect = async (volume) => {
    setSelectedVolume(volume)
    setIsScanning(true)
    setPhotoURLs([])
    setPreviewImages([])

    try {
      const result = await invoke('scan_volume_for_photos', { volumePath: volume.path })
      setPhotoURLs(result.photos)
      setPreviewImages(result.previews.slice(0, 4))
    } catch (error) {
      console.error('Error scanning volume:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const handleSelectDestination = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t('photoImport.selectDestination')
    })

    if (selected) {
      setDestinationFolder(selected)
    }
  }

  const canProceedFromStep1 = () => {
    return selectedVolume && photoURLs.length > 0 && !isScanning
  }

  const canProceedFromStep2 = () => {
    if (destinationOption === 'import') {
      return importFolder !== ''
    } else {
      return destinationFolder !== ''
    }
  }

  const canProceedFromStep3 = () => {
    return true // Description is optional
  }

  const canImport = () => {
    return !isImporting && photoURLs.length > 0
  }

  const handleNext = () => {
    if (currentStep === 1 && canProceedFromStep1()) {
      setUnlockedSteps(prev => new Set([...prev, 2]))
      setCurrentStep(2)
    } else if (currentStep === 2 && canProceedFromStep2()) {
      setUnlockedSteps(prev => new Set([...prev, 3]))
      setCurrentStep(3)
    } else if (currentStep === 3 && canProceedFromStep3()) {
      setUnlockedSteps(prev => new Set([...prev, 4]))
      setCurrentStep(4)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    setImportLog([])
    setImportedCount(0)

    try {
      // Use import folder if selected, otherwise use custom destination
      const finalDestination = destinationOption === 'import' ? importFolder : destinationFolder

      const result = await invoke('import_photos', {
        photos: photoURLs,
        destination: finalDestination,
        folderFormat: folderFormatOption,
        customFolderName: folderFormatOption === 'custom' ? customFolderName : null,
        description: photoDescription || null,
        deleteAfter: deleteAfterImport
      })

      const importCount = result.imported
      const importErrors = result.errors || []

      // Reset workflow to step 1
      setCurrentStep(1)
      setUnlockedSteps(new Set([1]))

      // Reset all states
      setSelectedVolume(null)
      setPhotoURLs([])
      setPreviewImages([])
      setDestinationOption('import')
      setDestinationFolder(importFolder) // Reset to import folder
      setFolderFormatOption('automatic')
      setCustomFolderName('')
      setPhotoDescription('')
      setDeleteAfterImport(false)

      // Show success message at step 1
      setImportedCount(importCount)
      setImportLog(importErrors)
      setShowSuccess(true)

      // Auto-hide success after 15 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setImportedCount(0)
        setImportLog([])
      }, 15000)

      // Reload volumes list
      loadVolumes()
    } catch (error) {
      console.error('Error importing photos:', error)
      setImportLog([error.toString()])
    } finally {
      setIsImporting(false)
    }
  }

  const getFolderPreview = () => {
    if (folderFormatOption === 'automatic') {
      const now = new Date()
      const year = String(now.getFullYear()).slice(-2)
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      return `${day}-${month}-${year} ${hours}-${minutes}`
    } else {
      return customFolderName || t('ui.customName')
    }
  }

  const getDestinationPath = () => {
    return destinationOption === 'import' ? importFolder : destinationFolder
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="bg-white rounded-lg shadow p-6">
        <Stepper
          steps={getSteps(t)}
          currentStep={currentStep}
          unlockedSteps={unlockedSteps}
          onStepClick={setCurrentStep}
        />
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* STEP 1: Device Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('photoImport.device')}</h2>
              <p className="text-gray-600">
                {t('photoImport.deviceDescription')}
              </p>
            </div>

            {/* Success Message (after import) */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">{t('photoImport.successImport')}</h3>
                    <p className="text-green-800">
                      <strong>{importedCount}</strong> {t('photoImport.photosImported')}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Log (after import) */}
            {importLog.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">{t('photoImport.errorsEncountered')}</h4>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {importLog.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {importLog.length > 5 && (
                    <li>{t('photoImport.moreErrors', { count: importLog.length - 5 })}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Volumes List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t('ui.detectedDevices')}</h3>
                <button
                  onClick={loadVolumes}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('common.refresh')}
                </button>
              </div>

              {volumes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <p className="text-gray-500">{t('ui.noDeviceDetected')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('ui.connectDevice')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {volumes.map((volume) => (
                    <button
                      key={volume.path}
                      onClick={() => handleVolumeSelect(volume)}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all
                        ${selectedVolume?.path === volume.path
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <svg className={`w-8 h-8 ${selectedVolume?.path === volume.path ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{volume.name}</div>
                          <div className="text-sm text-gray-500 truncate">{volume.path}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scanning Indicator */}
            {isScanning && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">{t('ui.scanningInProgress')}</span>
              </div>
            )}

            {/* Photo Preview */}
            {selectedVolume && photoURLs.length > 0 && !isScanning && (
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {photoURLs.length} {t('photoImport.photosDetected')}
                  </h3>
                </div>
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {previewImages.map((img, index) => (
                      <div key={index} className="bg-gray-200 rounded overflow-hidden flex items-center justify-center" style={{maxHeight: '200px'}}>
                        <img src={img} alt={`Preview ${index + 1}`} className="max-h-[200px] w-auto object-contain" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedVolume && photoURLs.length === 0 && !isScanning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">{t('ui.noPhotosFound')}</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Destination Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('ui.chooseDestination')}</h2>
              <p className="text-gray-600">
                {t('ui.selectDestinationInstructions')}
              </p>
            </div>

            {/* Destination Folder Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('ui.destinationFolder')}
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Import Folder Option */}
                <button
                  onClick={() => {
                    setDestinationOption('import')
                    setDestinationFolder(importFolder)
                  }}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${destinationOption === 'import'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                      ${destinationOption === 'import' ? 'border-blue-600' : 'border-gray-300'}
                    `}>
                      {destinationOption === 'import' && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-1">{t('ui.importFolder')}</div>
                      <div className="text-sm text-gray-600 mb-2">
                        {t('ui.importFolderDesc')}
                      </div>
                      {importFolder && (
                        <div className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200 truncate">
                          {importFolder}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Other Folder Option */}
                <button
                  onClick={() => setDestinationOption('other')}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${destinationOption === 'other'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                      ${destinationOption === 'other' ? 'border-blue-600' : 'border-gray-300'}
                    `}>
                      {destinationOption === 'other' && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-1">{t('ui.otherFolder')}</div>
                      <div className="text-sm text-gray-600 mb-3">
                        {t('ui.otherFolderDesc')}
                      </div>
                      {destinationOption === 'other' && (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            readOnly
                            value={destinationFolder || t('ui.noFolderSelected')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                          />
                          <button
                            onClick={handleSelectDestination}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            {t('ui.browse')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Folder Format Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('ui.folderNameFormat')}
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Automatic Format */}
                <button
                  onClick={() => setFolderFormatOption('automatic')}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${folderFormatOption === 'automatic'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                      ${folderFormatOption === 'automatic' ? 'border-blue-600' : 'border-gray-300'}
                    `}>
                      {folderFormatOption === 'automatic' && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-1">{t('ui.automaticFormat')}</div>
                      <div className="text-sm text-gray-600 mb-2">
                        {t('ui.automaticFormatDesc')}
                      </div>
                      <div className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200 inline-block">
                        {getFolderPreview()}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Custom Format */}
                <button
                  onClick={() => setFolderFormatOption('custom')}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${folderFormatOption === 'custom'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                      ${folderFormatOption === 'custom' ? 'border-blue-600' : 'border-gray-300'}
                    `}>
                      {folderFormatOption === 'custom' && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-1">{t('ui.customFormat')}</div>
                      <div className="text-sm text-gray-600 mb-3">
                        {t('ui.customFormatDesc')}
                      </div>
                      {folderFormatOption === 'custom' && (
                        <input
                          type="text"
                          value={customFolderName}
                          onChange={(e) => setCustomFolderName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={t('ui.customFolderPlaceholder')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Preview */}
            {getDestinationPath() && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">{t('ui.fullPath')}</div>
                <div className="font-mono text-sm text-gray-900 break-all">
                  {getDestinationPath()}/{getFolderPreview()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Description */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('ui.addDescription')}</h2>
              <p className="text-gray-600">
                {t('ui.addDescriptionInstructions')}
              </p>
            </div>

            {/* Description Text Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('photoImport.description')}
              </label>
              <textarea
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                rows="8"
                placeholder={t('photoImport.descriptionPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="text-sm text-gray-500 mt-2">
                {photoDescription.length} {photoDescription.length > 1 ? t('ui.characters') : t('ui.character')}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  {t('ui.descriptionSavedInFile')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Import */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('ui.reviewAndImport')}</h2>
              <p className="text-gray-600">
                {t('ui.reviewAndImportInstructions')}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">{t('ui.device')}</div>
                <div className="font-medium text-gray-900">{selectedVolume?.name || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">{t('photoImport.destination')}</div>
                <div className="font-medium text-gray-900 truncate">{getFolderPreview()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">{t('ui.photos')}</div>
                <div className="font-medium text-gray-900">{photoURLs.length}</div>
              </div>
            </div>

            {/* Delete After Import Toggle */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className={`w-6 h-6 ${deleteAfterImport ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={deleteAfterImport ? "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" : "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"} />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">{t('ui.emptyDeviceAfterImport')}</div>
                    <div className={`text-sm ${deleteAfterImport ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {deleteAfterImport ? t('ui.filesWillBeDeleted') : t('ui.filesWillBeKept')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteAfterImport(!deleteAfterImport)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${deleteAfterImport ? 'bg-red-600' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${deleteAfterImport ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={!canImport()}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-medium"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t('ui.importInProgress')}
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('ui.importPhotos', { count: photoURLs.length })}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('ui.previous')}
        </button>

        {currentStep < 4 && (
          <button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !canProceedFromStep1()) ||
              (currentStep === 2 && !canProceedFromStep2())
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {t('ui.next')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
