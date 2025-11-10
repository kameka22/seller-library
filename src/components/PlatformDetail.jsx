import { useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { useLanguage } from '../contexts/LanguageContext'

export default function PlatformDetail({ platform, onClose, onUpdate, onDeleteRequest }) {
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: platform.name,
    base_url: platform.base_url || '',
    api_key: platform.api_key || '',
    api_secret: platform.api_secret || '',
    environment: platform.environment || 'production',
  })
  const [showApiSecret, setShowApiSecret] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()

    const updateData = {
      name: formData.name !== platform.name ? formData.name : null,
      base_url: formData.base_url !== platform.base_url ? (formData.base_url || null) : null,
      api_key: formData.api_key !== platform.api_key ? (formData.api_key || null) : null,
      api_secret: formData.api_secret !== platform.api_secret ? (formData.api_secret || null) : null,
      environment: formData.environment !== platform.environment ? formData.environment : null,
    }

    try {
      const updated = await invoke('update_platform', { id: platform.id, request: updateData })
      onUpdate(updated)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating platform:', error)
      alert(t('platforms.updatingPlatform'))
    }
  }

  const handleDeleteClick = () => {
    if (onDeleteRequest) {
      onDeleteRequest()
    }
  }

  const isConfigured = platform.api_key && platform.api_secret
  const hasToken = platform.access_token

  return (
    <>
      {!isEditing ? (
        <div className="space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {t('platforms.connectionStatus')}
            </h3>
            <div className="flex items-center gap-2">
              {isConfigured ? (
                <>
                  {hasToken ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {t('platforms.connectedAuthenticated')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-orange-100 text-orange-800">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      {t('platforms.configuredAuthRequired')}
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  {t('platforms.notConfigured')}
                </span>
              )}
              {platform.environment === 'sandbox' && (
                <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                  {t('platforms.sandboxMode')}
                </span>
              )}
            </div>
          </div>

          {/* Base URL */}
          {platform.base_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {t('platforms.baseUrl')}
              </h3>
              <p className="text-gray-900">{platform.base_url}</p>
            </div>
          )}

          {/* API Configuration */}
          {isConfigured && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {t('platforms.apiConfiguration')}
              </h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                <div>
                  <span className="text-xs text-gray-500">{t('platforms.appId')}</span>
                  <p className="text-sm text-gray-900 font-mono">{platform.api_key}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{t('platforms.certId')}</span>
                  <p className="text-sm text-gray-900">••••••••</p>
                </div>
              </div>
            </div>
          )}

          {/* Token info */}
          {hasToken && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {t('platforms.authentication')}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">{t('platforms.activeToken')}</p>
                {platform.token_expires_at && (
                  <p className="text-xs text-gray-500">
                    Expire le {new Date(platform.token_expires_at).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-4 text-sm text-gray-500">
            <p>{t('ui.createdAt')} {new Date(platform.created_at).toLocaleString('fr-FR')}</p>
            {platform.updated_at && (
              <p>{t('ui.modifiedAt')} {new Date(platform.updated_at).toLocaleString('fr-FR')}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              {t('common.edit')}
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('platforms.platformName')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('platforms.baseUrl')}
            </label>
            <input
              type="url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('platforms.environment')}
            </label>
            <div className="relative">
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-gray-700 font-medium shadow-sm hover:border-gray-400 transition-colors"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              >
                <option value="production">{t('platforms.production')}</option>
                <option value="sandbox">{t('platforms.sandbox')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">{t('platforms.apiConfig')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('platforms.appId')}
                </label>
                <input
                  type="text"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('platforms.certId')}
                </label>
                <div className="relative">
                  <input
                    type={showApiSecret ? "text" : "password"}
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showApiSecret ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              {t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
