import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function Documentation() {
  const { t } = useLanguage()
  const [expandedSections, setExpandedSections] = useState({
    intro: true,
    categories: false,
    import: false,
    collection: false,
    objects: false,
    platforms: false,
    tips: false,
    faq: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const Section = ({ id, icon, title, children }) => (
    <div className="bg-white rounded-lg shadow mb-4">
      <button
        onClick={() => toggleSection(id)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <svg
          className={`w-6 h-6 text-gray-600 transition-transform ${expandedSections[id] ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expandedSections[id] && (
        <div className="px-6 pb-6 prose max-w-none">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold mb-4">{t('documentation.welcome')}</h1>
        <p className="text-lg opacity-90">{t('documentation.intro')}</p>
      </div>

      {/* Table of Contents */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('documentation.tableOfContents')}</h2>
        <ul className="space-y-2">
          <li><a href="#categories" className="text-blue-600 hover:underline">{t('documentation.section1')}</a></li>
          <li><a href="#import" className="text-blue-600 hover:underline">{t('documentation.section2')}</a></li>
          <li><a href="#collection" className="text-blue-600 hover:underline">{t('documentation.section3')}</a></li>
          <li><a href="#objects" className="text-blue-600 hover:underline">{t('documentation.section4')}</a></li>
          <li><a href="#platforms" className="text-blue-600 hover:underline">{t('documentation.section5')}</a></li>
        </ul>
      </div>

      {/* Introduction */}
      <Section id="intro" icon="🌟" title={t('documentation.welcomeTitle')}>
        <p className="text-lg mb-4">{t('documentation.introText')}</p>
      </Section>

      {/* Section 1: Categories */}
      <div id="categories">
        <Section id="categories" icon="📂" title={t('documentation.categoriesTitle')}>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.whatIsCategory')}</h3>
          <p className="mb-4">{t('documentation.categoryExplanation')}</p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
            <p className="font-semibold text-blue-900">{t('documentation.whyImportant')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-blue-800">
              <li>{t('documentation.categoryBenefit1')}</li>
              <li>{t('documentation.categoryBenefit2')}</li>
              <li>{t('documentation.categoryBenefit3')}</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.howToCreateCategory')}</h3>
          <ol className="list-decimal list-inside space-y-3 mb-6">
            <li className="font-medium">{t('documentation.categoryStep1')}</li>
            <li className="font-medium">{t('documentation.categoryStep2')}</li>
            <li className="font-medium">{t('documentation.categoryStep3')}</li>
            <li className="font-medium">{t('documentation.categoryStep4')}</li>
            <li className="font-medium">{t('documentation.categoryStep5')}</li>
          </ol>

          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-4">
            <p className="font-semibold text-yellow-900 mb-2">⚠️ {t('documentation.veryImportant')}</p>
            <p className="text-yellow-800">{t('documentation.categoryDeleteWarning')}</p>
          </div>

          <p className="text-gray-700 italic">{t('documentation.categoryAdvice')}</p>
        </Section>
      </div>

      {/* Section 2: Import */}
      <div id="import">
        <Section id="import" icon="📥" title={t('documentation.importTitle')}>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.twoWaysToImport')}</h3>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li className="font-medium">{t('documentation.importExternal')}</li>
            <li className="font-medium">{t('documentation.importLocal')}</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.method1Title')}</h3>
          <p className="mb-4 italic text-gray-700">{t('documentation.method1Situation')}</p>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('documentation.stepByStep')}</h4>
          <ol className="list-decimal list-inside space-y-4 mb-6">
            <li>
              <span className="font-medium">{t('documentation.importStep1Title')}</span>
              <p className="ml-6 mt-1 text-gray-700">{t('documentation.importStep1Detail')}</p>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep2Title')}</span>
              <p className="ml-6 mt-1 text-gray-700">{t('documentation.importStep2Detail')}</p>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep3Title')}</span>
              <p className="ml-6 mt-1 text-gray-700">{t('documentation.importStep3Detail')}</p>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep4Title')}</span>
              <p className="ml-6 mt-1 text-gray-700">{t('documentation.importStep4Detail')}</p>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep5Title')}</span>
              <p className="ml-6 mt-2 text-gray-700">{t('documentation.importStep5DetailIntro')}</p>
              <div className="ml-6 mt-2 bg-green-50 border border-green-200 rounded p-3">
                <p className="font-medium text-green-900">{t('documentation.importOptionATitle')}</p>
                <p className="text-green-800 text-sm mt-1">{t('documentation.importOptionADetail')}</p>
              </div>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep6Title')}</span>
              <p className="ml-6 mt-2 text-gray-700">{t('documentation.importStep6DetailIntro')}</p>
              <div className="ml-6 mt-2 bg-green-50 border border-green-200 rounded p-3">
                <p className="font-medium text-green-900">{t('documentation.importDestinationOptionATitle')}</p>
                <p className="text-green-800 text-sm mt-1">{t('documentation.importDestinationOptionADetail')}</p>
              </div>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep7Title')}</span>
              <p className="ml-6 mt-2 text-gray-700">{t('documentation.importStep7DetailIntro')}</p>
              <div className="ml-6 mt-2 bg-green-50 border border-green-200 rounded p-3">
                <p className="font-medium text-green-900">{t('documentation.importFormatOptionATitle')}</p>
                <p className="text-green-800 text-sm mt-1">{t('documentation.importFormatOptionADetail')}</p>
              </div>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep8Title')}</span>
              <p className="ml-6 mt-1 text-gray-700">{t('documentation.importStep8Detail')}</p>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep9Title')}</span>
              <p className="ml-6 mt-1 text-gray-700">{t('documentation.importStep9Detail')}</p>
            </li>
            <li>
              <span className="font-medium">{t('documentation.importStep10Title')}</span>
              <p className="ml-6 mt-1 text-gray-700">{t('documentation.importStep10Detail')}</p>
            </li>
          </ol>

          <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-6">
            <p className="font-bold text-green-900">🎉 {t('documentation.congratulations')}</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.method2Title')}</h3>
          <p className="mb-4 italic text-gray-700">{t('documentation.method2Situation')}</p>
          <ol className="list-decimal list-inside space-y-3 mb-6">
            <li>{t('documentation.localImportStep1')}</li>
            <li>{t('documentation.localImportStep2')}</li>
            <li>{t('documentation.localImportStep3')}</li>
            <li>{t('documentation.localImportStep4')}</li>
            <li>{t('documentation.localImportStep5')}</li>
            <li>{t('documentation.localImportStep6')}</li>
          </ol>
        </Section>
      </div>

      {/* Section 3: Collection */}
      <div id="collection">
        <Section id="collection" icon="🖼️" title={t('documentation.collectionTitle')}>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.seeAllPhotos')}</h3>
          <p className="mb-4">{t('documentation.seeAllPhotosDetail')}</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.understandInterface')}</h3>
          <p className="mb-4">{t('documentation.interfaceIntro')}</p>
          <ul className="list-disc list-inside space-y-3 mb-6">
            <li className="font-medium">{t('documentation.interfaceNavBar')}</li>
            <li className="font-medium">{t('documentation.interfaceSearch')}</li>
            <li className="font-medium">{t('documentation.interfaceDisplay')}</li>
            <li className="font-medium">{t('documentation.interfaceToolbar')}</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.basicActions')}</h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('documentation.viewPhoto')}</h4>
          <p className="mb-4 text-gray-700">{t('documentation.viewPhotoDetail')}</p>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('documentation.editPhoto')}</h4>
          <p className="mb-4 text-gray-700">{t('documentation.editPhotoDetail')}</p>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('documentation.selectMultiple')}</h4>
          <p className="mb-4 text-gray-700">{t('documentation.selectMultipleDetail')}</p>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('documentation.movePhotos')}</h4>
          <p className="mb-4 text-gray-700">{t('documentation.movePhotosDetail')}</p>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('documentation.deletePhotos')}</h4>
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
            <p className="font-semibold text-red-900 mb-2">⚠️ {t('documentation.attention')}</p>
            <p className="text-red-800">{t('documentation.deletePhotosDetail')}</p>
          </div>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('documentation.createDescription')}</h4>
          <p className="mb-4 text-gray-700">{t('documentation.createDescriptionDetail')}</p>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('documentation.syncDatabase')}</h4>
          <p className="mb-4 text-gray-700">{t('documentation.syncDatabaseDetail')}</p>
        </Section>
      </div>

      {/* Section 4: Objects */}
      <div id="objects">
        <Section id="objects" icon="📦" title={t('documentation.objectsTitle')}>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.whatIsObject')}</h3>
          <p className="mb-4">{t('documentation.objectExplanation')}</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.method1ObjectTitle')}</h3>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
            <p className="font-semibold text-blue-900">{t('documentation.fastestMethod')}</p>
          </div>
          <p className="mb-4 text-gray-700">{t('documentation.method1ObjectDetail')}</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.method2ObjectTitle')}</h3>
          <p className="mb-4 text-gray-700">{t('documentation.method2ObjectDetail')}</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.editObject')}</h3>
          <p className="mb-4 text-gray-700">{t('documentation.editObjectDetail')}</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.searchObjects')}</h3>
          <p className="mb-4 text-gray-700">{t('documentation.searchObjectsDetail')}</p>
        </Section>
      </div>

      {/* Section 5: Platforms */}
      <div id="platforms">
        <Section id="platforms" icon="🌐" title={t('documentation.platformsTitle')}>
          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-4">
            <p className="font-semibold text-yellow-900">{t('documentation.advancedFeature')}</p>
          </div>
          <p className="mb-4">{t('documentation.platformsExplanation')}</p>
        </Section>
      </div>

      {/* Tips & Best Practices */}
      <Section id="tips" icon="💡" title={t('documentation.tipsTitle')}>
        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.recommendedWorkflow')}</h3>
        <ol className="list-decimal list-inside space-y-2 mb-6">
          <li>{t('documentation.workflow1')}</li>
          <li>{t('documentation.workflow2')}</li>
          <li>{t('documentation.workflow3')}</li>
          <li>{t('documentation.workflow4')}</li>
          <li>{t('documentation.workflow5')}</li>
        </ol>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.tipsToSaveTime')}</h3>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li>{t('documentation.tip1')}</li>
          <li>{t('documentation.tip2')}</li>
          <li>{t('documentation.tip3')}</li>
          <li>{t('documentation.tip4')}</li>
          <li>{t('documentation.tip5')}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{t('documentation.commonMistakes')}</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-3">
          <p className="font-semibold text-red-900 mb-2">❌ {t('documentation.dontDoThis')}</p>
          <ul className="list-disc list-inside space-y-1 text-red-800">
            <li>{t('documentation.mistake1')}</li>
            <li>{t('documentation.mistake2')}</li>
            <li>{t('documentation.mistake3')}</li>
          </ul>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="font-semibold text-green-900 mb-2">✅ {t('documentation.doThisInstead')}</p>
          <ul className="list-disc list-inside space-y-1 text-green-800">
            <li>{t('documentation.goodPractice1')}</li>
            <li>{t('documentation.goodPractice2')}</li>
            <li>{t('documentation.goodPractice3')}</li>
          </ul>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" icon="❓" title={t('documentation.faqTitle')}>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-900">{t('documentation.faq1Question')}</p>
            <p className="text-gray-700 mt-1">{t('documentation.faq1Answer')}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{t('documentation.faq2Question')}</p>
            <p className="text-gray-700 mt-1">{t('documentation.faq2Answer')}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{t('documentation.faq3Question')}</p>
            <p className="text-gray-700 mt-1">{t('documentation.faq3Answer')}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{t('documentation.faq4Question')}</p>
            <p className="text-gray-700 mt-1">{t('documentation.faq4Answer')}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{t('documentation.faq5Question')}</p>
            <p className="text-gray-700 mt-1">{t('documentation.faq5Answer')}</p>
          </div>
        </div>
      </Section>

      {/* Final message */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-xl font-bold">🎉 {t('documentation.readyToUse')}</p>
      </div>

      {/* Back to top button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          {t('documentation.backToTop')}
        </button>
      </div>
    </div>
  )
}
