import { useLanguage } from '../contexts/LanguageContext'

export default function Sales() {
  const { t } = useLanguage()

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-xl text-gray-600">{t('platforms.salesComingSoon')}</p>
      </div>
    </div>
  )
}
