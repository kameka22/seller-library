export default function PlatformCard({ platform, onClick }) {
  const isConfigured = platform.api_key && platform.api_secret
  const hasToken = platform.access_token

  return (
    <div
      onClick={() => onClick(platform)}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {platform.name}
        </h3>
        <div className="flex items-center gap-2">
          {platform.environment === 'sandbox' && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
              Sandbox
            </span>
          )}
          {isConfigured ? (
            <div className={`w-3 h-3 rounded-full ${hasToken ? 'bg-green-500' : 'bg-orange-500'}`} title={hasToken ? 'Connecté' : 'Configuré'} />
          ) : (
            <div className="w-3 h-3 rounded-full bg-gray-300" title="Non configuré" />
          )}
        </div>
      </div>

      {platform.base_url && (
        <p className="text-sm text-gray-600 mb-3 truncate">
          {platform.base_url}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {isConfigured ? (
          <>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              ✓ API configurée
            </span>
            {hasToken && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                ✓ Authentifié
              </span>
            )}
          </>
        ) : (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
            Configuration requise
          </span>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Créé le {new Date(platform.created_at).toLocaleDateString('fr-FR')}
      </div>
    </div>
  )
}
