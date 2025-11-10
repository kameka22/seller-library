import { useState, useEffect } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { invoke } from '@tauri-apps/api/tauri'
import Stepper from './Stepper'
import { useLanguage } from '../contexts/LanguageContext'

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

  // Load volumes on mount
  useEffect(() => {
    loadVolumes()
  }, [])

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
    return destinationFolder !== ''
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
      const result = await invoke('import_photos', {
        photos: photoURLs,
        destination: destinationFolder,
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
      setDestinationFolder('')
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
      return `${year}-${month}-${day} ${hours}-${minutes}`
    } else {
      return customFolderName || 'nom_personnalisé'
    }
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('photoImport.selectDestination')}</h2>
              <p className="text-gray-600">
                Sélectionnez un périphérique externe (clé USB, carte SD, disque dur) contenant les photos à importer.
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
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Import réussi !</h3>
                    <p className="text-green-800">
                      <strong>{importedCount}</strong> photo{importedCount > 1 ? 's' : ''} importée{importedCount > 1 ? 's' : ''} avec succès.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Log (after import) */}
            {importLog.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Erreurs rencontrées :</h4>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {importLog.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {importLog.length > 5 && (
                    <li>... et {importLog.length - 5} autre(s) erreur(s)</li>
                  )}
                </ul>
              </div>
            )}

            {/* Volumes List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Appareils détectés</h3>
                <button
                  onClick={loadVolumes}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualiser
                </button>
              </div>

              {volumes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <p className="text-gray-500">Aucun appareil externe détecté</p>
                  <p className="text-sm text-gray-400 mt-1">Connectez une clé USB, carte SD ou disque dur</p>
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
                <span className="text-gray-600">Scan en cours...</span>
              </div>
            )}

            {/* Photo Preview */}
            {selectedVolume && photoURLs.length > 0 && !isScanning && (
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {photoURLs.length} photo{photoURLs.length > 1 ? 's' : ''} détectée{photoURLs.length > 1 ? 's' : ''}
                  </h3>
                </div>
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {previewImages.map((img, index) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded overflow-hidden">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedVolume && photoURLs.length === 0 && !isScanning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">Aucune photo trouvée sur cet appareil.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Destination Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choisir la destination</h2>
              <p className="text-gray-600">
                Sélectionnez le dossier de destination et le format du nom de dossier.
              </p>
            </div>

            {/* Destination Folder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dossier de destination
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  readOnly
                  value={destinationFolder || 'Aucun dossier sélectionné'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <button
                  onClick={handleSelectDestination}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Parcourir
                </button>
              </div>
            </div>

            {/* Folder Format Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Format du nom de dossier
              </label>

              {/* Automatic Format */}
              <button
                onClick={() => setFolderFormatOption('automatic')}
                className={`
                  w-full p-4 rounded-lg border-2 text-left mb-3 transition-all
                  ${folderFormatOption === 'automatic'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                    ${folderFormatOption === 'automatic' ? 'border-blue-600' : 'border-gray-300'}
                  `}>
                    {folderFormatOption === 'automatic' && (
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">Format automatique</div>
                    <div className="text-sm text-gray-600">
                      Le dossier sera nommé avec la date et l'heure actuelles
                    </div>
                    <div className="text-sm text-gray-500 mt-2 font-mono bg-white px-3 py-1 rounded border border-gray-200 inline-block">
                      {getFolderPreview()}
                    </div>
                  </div>
                </div>
              </button>

              {/* Custom Format */}
              <button
                onClick={() => setFolderFormatOption('custom')}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${folderFormatOption === 'custom'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                    ${folderFormatOption === 'custom' ? 'border-blue-600' : 'border-gray-300'}
                  `}>
                    {folderFormatOption === 'custom' && (
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">Format personnalisé</div>
                    <div className="text-sm text-gray-600 mb-3">
                      Choisissez votre propre nom de dossier
                    </div>
                    {folderFormatOption === 'custom' && (
                      <input
                        type="text"
                        value={customFolderName}
                        onChange={(e) => setCustomFolderName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Ex: Vacances_2024"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Preview */}
            {destinationFolder && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Chemin complet :</div>
                <div className="font-mono text-sm text-gray-900 break-all">
                  {destinationFolder}/{getFolderPreview()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Description */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ajouter une description (optionnel)</h2>
              <p className="text-gray-600">
                Ajoutez des notes ou une description qui seront sauvegardées avec les photos importées.
              </p>
            </div>

            {/* Description Text Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                rows="8"
                placeholder="Exemple : « Superbe faience de quimper », « Statue de bronze »..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="text-sm text-gray-500 mt-2">
                {photoDescription.length} caractère{photoDescription.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  La description sera enregistrée dans un fichier <span className="font-mono font-medium">description.txt</span> dans le dossier de destination.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Import */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Révision et import</h2>
              <p className="text-gray-600">
                Vérifiez les paramètres et lancez l'import des photos.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Appareil</div>
                <div className="font-medium text-gray-900">{selectedVolume?.name || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Destination</div>
                <div className="font-medium text-gray-900 truncate">{getFolderPreview()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Photos</div>
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
                    <div className="font-medium text-gray-900">Vider l'appareil après import</div>
                    <div className={`text-sm ${deleteAfterImport ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {deleteAfterImport ? 'Les fichiers seront supprimés' : 'Les fichiers seront conservés'}
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
                  Import en cours...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Importer {photoURLs.length} photo{photoURLs.length > 1 ? 's' : ''}
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
          Précédent
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
            Suivant
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
