'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PlayIcon, ArrowLeftIcon, SparklesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import DownloadSettings from '@/components/DownloadSettings'
import HeaderStatusIndicator from '@/components/HeaderStatusIndicator'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { UserPreferencesService } from '@/lib/user-preferences-service'
import { GenreService } from '@/lib/genre-service'
import { ContentService } from '@/lib/content-service'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'recommendations' | 'download'>('recommendations')
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([])

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Charger les préférences utilisateur
    const preferences = UserPreferencesService.getUserPreferences()
    setFavoriteGenres(preferences.favoriteGenres)
  }, [])


  const tabs = [
    {
      id: 'recommendations' as const,
      name: 'Recommandations',
      icon: SparklesIcon,
      description: 'Personnalisez vos recommandations'
    },
    {
      id: 'download' as const,
      name: 'Téléchargement',
      icon: ArrowDownTrayIcon,
      description: `Installez ${isClient ? content.appIdentity.name : 'Atiha'} sur vos appareils`
    }
  ]



  const renderRecommendationsContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Personnaliser vos recommandations</h3>
        <p className="text-sm sm:text-base text-gray-400">Aidez-nous à mieux vous connaître pour des recommandations plus précises</p>
      </div>

      <div className="bg-dark-300 rounded-lg p-6">
        <h4 className="text-base sm:text-lg font-semibold text-white mb-4">Genres préférés</h4>
        <div className="space-y-3">
          {GenreService.getAllUniqueGenres(ContentService.getMoviesSync(), ContentService.getSeriesSync()).map((genre) => (
            <label key={genre} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 bg-dark-400 border-gray-600 rounded"
                style={isClient ? {
                  accentColor: content.appIdentity.colors.primary
                } : {
                  accentColor: '#3B82F6'
                }}
                checked={favoriteGenres.includes(genre)}
                onChange={(e) => {
                  if (e.target.checked) {
                    const newGenres = [...favoriteGenres, genre]
                    setFavoriteGenres(newGenres)
                    UserPreferencesService.updateFavoriteGenres(newGenres)
                  } else {
                    const newGenres = favoriteGenres.filter(g => g !== genre)
                    setFavoriteGenres(newGenres)
                    UserPreferencesService.updateFavoriteGenres(newGenres)
                  }
                }}
              />
              <span className="text-sm sm:text-base text-white">{genre}</span>
            </label>
          ))}
        </div>
      </div>


      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4">
        <button 
          onClick={() => {
            setFavoriteGenres([])
            UserPreferencesService.resetPreferences()
          }}
          className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Réinitialiser
        </button>
        <button 
          onClick={() => {
            UserPreferencesService.updateFavoriteGenres(favoriteGenres)
            // Optionnel: afficher une notification de succès
            alert('Préférences sauvegardées avec succès !')
          }}
          className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-white rounded-lg transition-colors"
          style={isClient ? { 
            backgroundColor: content.appIdentity.colors.primary,
            '--hover-color': content.appIdentity.colors.secondary
          } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
          onMouseEnter={(e) => {
            if (isClient) {
              e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
            }
          }}
          onMouseLeave={(e) => {
            if (isClient) {
              e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
            }
          }}
        >
          Sauvegarder les préférences
        </button>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="bg-dark-400/50 backdrop-blur-sm border-b border-gray-700">
          <div className="px-6 py-4">
            <nav className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Retour</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                >
                  <PlayIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'}</span>
              </Link>
                <HeaderStatusIndicator />
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Paramètres</h1>
              <p className="text-sm sm:text-base text-gray-400">
                Gérez votre abonnement et vos recommandations
              </p>
            </div>

            {/* Tabs Navigation */}
            <div className="mb-8">
              <div className="border-b border-gray-700">
                <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'text-white'
                            : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        }`}
                        style={activeTab === tab.id && isClient ? { 
                          borderBottomColor: content.appIdentity.colors.primary
                        } : {}}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{tab.name}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
              {activeTab === 'recommendations' && renderRecommendationsContent()}
              {activeTab === 'download' && <DownloadSettings />}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
