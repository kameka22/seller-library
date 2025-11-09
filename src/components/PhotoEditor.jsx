import { useState, useRef, useEffect } from 'react'
import { readBinaryFile } from '@tauri-apps/api/fs'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import ConfirmModal from './ConfirmModal'

export default function PhotoEditor({ photo, onClose, onSave }) {
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [scale, setScale] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [isCropping, setIsCropping] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [createCopy, setCreateCopy] = useState(true)
  const [transformedImageUrl, setTransformedImageUrl] = useState(null)

  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const cropImageRef = useRef(null)

  useEffect(() => {
    const loadImage = async () => {
      try {
        const fileData = await readBinaryFile(photo.file_path)
        const blob = new Blob([fileData])
        const url = URL.createObjectURL(blob)

        const img = new Image()
        img.onload = () => {
          imageRef.current = img
          URL.revokeObjectURL(url)
          applyTransformations()
        }
        img.src = url
      } catch (error) {
        console.error('Error loading image:', error)
      }
    }

    loadImage()
  }, [photo])

  useEffect(() => {
    if (imageRef.current && !isCropping) {
      applyTransformations()
    }
  }, [brightness, contrast, scale, rotation, isCropping])

  const applyTransformations = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const img = imageRef.current

    // Créer un canvas temporaire pour les transformations
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    // Calculer les dimensions avec le scale
    const scaledWidth = Math.round((img.width * scale) / 100)
    const scaledHeight = Math.round((img.height * scale) / 100)

    // Définir les dimensions du canvas temporaire selon la rotation
    if (rotation === 90 || rotation === 270) {
      tempCanvas.width = scaledHeight
      tempCanvas.height = scaledWidth
    } else {
      tempCanvas.width = scaledWidth
      tempCanvas.height = scaledHeight
    }

    // Appliquer la rotation
    tempCtx.save()
    if (rotation === 90) {
      tempCtx.translate(tempCanvas.width, 0)
      tempCtx.rotate((90 * Math.PI) / 180)
      tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
    } else if (rotation === 180) {
      tempCtx.translate(tempCanvas.width, tempCanvas.height)
      tempCtx.rotate((180 * Math.PI) / 180)
      tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
    } else if (rotation === 270) {
      tempCtx.translate(0, tempCanvas.height)
      tempCtx.rotate((270 * Math.PI) / 180)
      tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
    } else {
      tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
    }
    tempCtx.restore()

    // Appliquer luminosité et contraste
    if (brightness !== 100 || contrast !== 100) {
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imageData.data

      const brightnessFactor = brightness / 100
      const contrastFactor = contrast / 100

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i] * brightnessFactor
        let g = data[i + 1] * brightnessFactor
        let b = data[i + 2] * brightnessFactor

        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255

        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
      }

      tempCtx.putImageData(imageData, 0, 0)
    }

    // Copier sur le canvas principal
    canvas.width = tempCanvas.width
    canvas.height = tempCanvas.height
    ctx.drawImage(tempCanvas, 0, 0)

    // Générer l'URL de l'image transformée pour ReactCrop
    const dataUrl = tempCanvas.toDataURL('image/png')
    setTransformedImageUrl(dataUrl)
  }

  const handleSaveClick = () => {
    setShowSaveModal(true)
  }

  const confirmSave = async () => {
    let canvas = canvasRef.current

    // Si un crop a été appliqué, créer un nouveau canvas avec le crop
    if (completedCrop && cropImageRef.current) {
      const cropCanvas = document.createElement('canvas')
      const cropCtx = cropCanvas.getContext('2d')
      const image = cropImageRef.current

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      cropCanvas.width = completedCrop.width * scaleX
      cropCanvas.height = completedCrop.height * scaleY

      cropCtx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      )

      canvas = cropCanvas
    }

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      // Create a File object from the blob
      const file = new File([blob], photo.file_name, { type: 'image/jpeg' })

      // Read as base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1]
        await onSave(photo.id, base64Data, createCopy)
        setShowSaveModal(false)
      }
      reader.readAsDataURL(file)
    }, 'image/jpeg', 0.95)
  }

  const handleReset = () => {
    setBrightness(100)
    setContrast(100)
    setScale(100)
    setRotation(0)
    setCrop(null)
    setCompletedCrop(null)
    setIsCropping(false)
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleCropToggle = () => {
    setIsCropping(true)
    setCrop(null)
    setCompletedCrop(null)
  }

  const handleApplyCrop = () => {
    if (!completedCrop || !cropImageRef.current) {
      return
    }

    const cropImage = cropImageRef.current

    // Créer un canvas temporaire pour le crop
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    // Calculer le ratio entre l'image naturelle et sa taille affichée
    const scaleX = cropImage.naturalWidth / cropImage.width
    const scaleY = cropImage.naturalHeight / cropImage.height

    // Calculer les dimensions réelles du crop
    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY

    // Redimensionner le canvas temporaire pour la zone croppée
    tempCanvas.width = cropWidth
    tempCanvas.height = cropHeight

    // Dessiner la zone croppée sur le canvas temporaire
    tempCtx.drawImage(
      cropImage,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    )

    // Générer la nouvelle URL de l'image croppée
    const newUrl = tempCanvas.toDataURL('image/png')
    setTransformedImageUrl(newUrl)

    // Mettre à jour imageRef pour les prochaines transformations
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      // Appliquer les transformations sur le canvas principal
      setTimeout(() => {
        if (canvasRef.current) {
          applyTransformations()
        }
      }, 0)
    }
    img.src = newUrl

    setIsCropping(false)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  const handleCancelCrop = () => {
    setCrop(null)
    setCompletedCrop(null)
    setIsCropping(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900">
                Éditer la photo
              </h2>
              <p className="text-sm text-gray-500 truncate mt-1" title={photo.file_name}>
                {photo.file_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* Main Content: Image + Controls */}
          <div className="flex gap-6">
            {/* Image Preview with Crop */}
            <div className="flex-1 bg-gray-100 rounded-lg overflow-auto flex items-center justify-center" style={{ minHeight: '500px', maxHeight: '70vh' }}>
              {isCropping && transformedImageUrl ? (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                >
                  <img
                    ref={cropImageRef}
                    src={transformedImageUrl}
                    alt="Crop preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '65vh'
                    }}
                  />
                </ReactCrop>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Controls Panel */}
            <div className="w-80 flex flex-col">
              <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {/* Rotation & Crop Buttons */}
                {!isCropping ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleRotate}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                    >
                      ↻ Rotation 90°
                    </button>
                    <button
                      onClick={handleCropToggle}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      ✂ Recadrer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 text-center">Mode recadrage</div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApplyCrop}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                        disabled={!completedCrop}
                      >
                        ✓ Appliquer
                      </button>
                      <button
                        onClick={handleCancelCrop}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                      >
                        ✕ Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Crop Info */}
                {isCropping && completedCrop && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-green-900 mb-2">Zone de recadrage</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Position: {Math.round(completedCrop.x)}, {Math.round(completedCrop.y)}</div>
                      <div>Taille: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}</div>
                    </div>
                  </div>
                )}

                {/* Scale Control */}
                {!isCropping && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Taille
                      </label>
                      <span className="text-sm text-gray-600 font-semibold">{scale}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={scale}
                      onChange={(e) => setScale(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                )}

                {/* Brightness Control */}
                {!isCropping && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Luminosité
                      </label>
                      <span className="text-sm text-gray-600 font-semibold">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                )}

                {/* Contrast Control */}
                {!isCropping && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Contraste
                      </label>
                      <span className="text-sm text-gray-600 font-semibold">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                )}

                {!isCropping && (
                  <div className="pt-4">
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isCropping && (
                <div className="flex flex-col gap-2 pt-4 border-t mt-4">
                  <button
                    onClick={handleSaveClick}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      <ConfirmModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Enregistrer les modifications"
        message="Comment souhaitez-vous enregistrer les modifications ?"
        confirmText="Enregistrer"
        cancelText="Annuler"
        danger={false}
      >
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label htmlFor="create-copy" className="text-sm font-medium text-gray-900 block">
                Créer une copie
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {createCopy
                  ? 'Une copie sera créée avec le nom "' + photo.file_name.replace(/(\.[^.]+)$/, ' (x)$1') + '"'
                  : 'La photo originale sera modifiée définitivement'}
              </p>
            </div>
            <button
              type="button"
              id="create-copy"
              onClick={() => setCreateCopy(!createCopy)}
              className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                createCopy ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  createCopy ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </ConfirmModal>
    </div>
  )
}
